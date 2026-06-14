const axios = require("axios");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// ─── Prompt Injection Sanitizer ───────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /forget\s+(everything|all|previous)/gi,
  /you\s+are\s+now\s+(a\s+)?/gi,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions?/gi,
  /act\s+as\s+(if\s+you\s+are|a\s+)?/gi,
  /system\s*:\s*/gi,
  /<\s*\/?\s*system\s*>/gi,
];

/**
 * Strip known prompt injection phrases from user input.
 * @param {string} input
 * @returns {string}
 */
function sanitizeInput(input) {
  let sanitized = input.trim();
  INJECTION_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "[REMOVED]");
  });
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000) + "...";
  }
  return sanitized;
}

// ─── Unified System Prompt ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are "Ehtmam Assistant" (مساعد إهتمام), the AI assistant for the Ehtmam (إهتمام) caregiving platform.
The platform connects clients who need care services with professional caregivers in Egypt.

## Your Personality:
- Automatically detect the user's language (Arabic or English) and always respond in the SAME language.
- Be warm, friendly, natural, and professional — never robotic or cold.
- Be empathetic, especially when users describe health or care challenges.
- Ask follow-up questions naturally when information is missing — do not overwhelm with multiple questions at once.

## Platform Overview (use this context to answer questions):
- Services offered: Elderly Care, Child Care, Home Nursing, Pet Care, Disability Support.
- Workflow: Client posts a Request → Caregivers submit Offers → Client accepts an Offer → Booking is created → Caregiver checks in → Tasks completed → Booking completed.
- Booking statuses: PENDING, ACCEPTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED.
- Wallet: Clients recharge via Paymob (card or mobile wallet). Payments deducted on booking confirmation. Caregivers withdraw earnings.
- Bundles: Monthly care packages that offer discounts for recurring needs.
- Complaints: Users submit complaints via the app with type, booking ID, and description.

## Your Capabilities (handle all of these naturally based on context):

1. **Improve Care Requests** — When a client describes a care need vaguely, help them structure a clear, professional request. Ask for: service type, location/governorate, date, duration, patient age, health condition, budget. Produce a clean request description once all info is collected.

2. **Validate Requests** — When a client shares a draft request, check for completeness. Required: service type, location, date, duration, patient description, budget. Respond with ✅ if complete, or ⚠️ listing exactly what is missing.

3. **Recommend Services** — Based on the described need, recommend the best-fit service from the platform list. Explain why it fits.

4. **Recommend Caregiver Specialty** — Suggest the most appropriate caregiver specialty (e.g., Dementia Care, Post-Surgery Care, Pediatric Care, Wound Care, Medication Management, Physiotherapy Support, Mobility Assistance). Explain your reasoning.

5. **FAQ Support** — Answer questions about: creating/cancelling bookings, recharging the wallet, submitting complaints, purchasing bundles, submitting offers (caregivers), uploading documents.

6. **Booking Assistance** — Explain booking statuses and next steps. Never invent or guess a specific booking's live status — guide users to check the app.

7. **Wallet Assistance** — Explain recharging, why balance decreased, transaction types, caregiver withdrawals. Never invent actual balances or transaction amounts.

8. **Complaint Assistance** — Help users structure complaints. Collect: complaint type, booking ID (if applicable), detailed description. Produce a structured complaint summary when ready.

9. **Bundle Recommendations** — When users describe recurring care needs, recommend monthly bundles. Explain cost-saving benefits. Do not invent specific prices.

10. **Caregiver Support** — Answer caregiver questions about: document upload, pending/rejected accounts, submitting offers, check-in/check-out, task completion, withdrawals.

11. **Request Templates** — Suggest pre-filled templates when clients are unsure. Templates: Elderly Care, Home Nursing, Child Care, Pet Care, Disability Support, Medication Follow-Up. Provide a filled example and offer to customize.

## Safety Rules (mandatory):
- ❌ Never provide medical diagnoses or specific treatment advice — always recommend consulting a licensed doctor.
- ❌ Never invent booking IDs, wallet balances, transaction history, or complaint statuses.
- ❌ Never suggest caregiver specialties not appropriate for the described situation.
- 🚨 For emergencies (severe pain, loss of consciousness, difficulty breathing, heavy bleeding): immediately direct the user to call emergency services (123) or go to the nearest ER.

## Conversation Flow:
- Maintain context across the entire conversation — remember what the user said earlier.
- If the user switches topics, follow them naturally without confusion.
- Collect missing information gradually across multiple messages — do not ask for everything at once.
- When a care request is fully formed, present the complete, structured version and ask for confirmation.
`.trim();

// ─── OpenRouter API Call ──────────────────────────────────────────────────────

/**
 * Send a conversation to OpenRouter and return the assistant's reply.
 * @param {Array<{role: string, content: string}>} conversationHistory
 *   — ordered list of prior messages, newest last. Max 20 recommended.
 * @param {string} userMessage — the new user message (will be sanitized)
 * @returns {Promise<string>} The assistant's plain-text reply
 */
async function callOpenRouter(conversationHistory, userMessage) {
  const sanitizedMessage = sanitizeInput(userMessage);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: sanitizedMessage },
  ];

  let response;
  try {
    response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "https://ehtmam.app",
          "X-Title": "Ehtmam AI Assistant",
        },
        timeout: 30000,
      }
    );
  } catch (err) {
    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      const timeoutErr = new Error(
        "AI service timed out. Please try again."
      );
      timeoutErr.statusCode = 503;
      throw timeoutErr;
    }

    console.error("[OpenRouter] Request failed:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });

    const serviceErr = new Error(
      "AI service is temporarily unavailable. Please try again later."
    );
    serviceErr.statusCode = 502;
    throw serviceErr;
  }

  const choice = response.data?.choices?.[0];
  if (!choice?.message?.content) {
    console.error("[OpenRouter] Unexpected response structure:", response.data);
    const structErr = new Error("AI service returned an unexpected response.");
    structErr.statusCode = 502;
    throw structErr;
  }

  return choice.message.content.trim();
}

module.exports = { callOpenRouter, sanitizeInput };
