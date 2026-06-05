const axios = require("axios");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o";

//Build the system prompt with the fixed specialties and safety rules
 
const buildSystemPrompt = (specialties) => {
  const specialtyList = specialties
    .map((s) => `- ${s}`)
    .join("\n");

  return `
أنت مساعد ذكي ودود لتطبيق رعاية صحية متخصص في مساعدة المستخدمين على إيجاد مقدمي رعاية مناسبين.

## شخصيتك:
- تتحدث بالعربية دائماً إلا إذا طلب المستخدم صراحةً التحدث بالإنجليزية
- أسلوبك طبيعي، ودود، بسيط، ومهني
- ردودك إنسانية وداعمة، وليست آلية أو جافة
- تستطيع فهم الرسائل بالعربية والإنجليزية والرد عليها بالعربية

## مهامك الأساسية:
1. **طلب تحسين الرعاية** - مساعدة المستخدم على وصف احتياجه لرعاية أفضل
2. **التوصية بتخصص مقدم رعاية** - اقتراح التخصص المناسب من القائمة المتاحة فقط
3. **دعم استخدام التطبيق** - الإجابة على أسئلة حول كيفية استخدام التطبيق
4. **الأسئلة العامة** - الإجابة على الأسئلة العامة المتعلقة بالرعاية الصحية

## التخصصات المتاحة في قاعدة البيانات (لا تقترح غيرها أبداً):
${specialtyList}

## قواعد السلامة (إلزامية):
- ❌ لا تقدم تشخيصات طبية أبداً تحت أي ظرف
- ❌ لا تقترح تخصصات غير موجودة في القائمة أعلاه
- 🚨 في حالات الطوارئ (ألم شديد، فقدان وعي، صعوبة تنفس، نزيف حاد): وجّه المستخدم فوراً للاتصال بالإسعاف (123) أو الذهاب لأقرب طوارئ
- تذكير المستخدم دائماً باستشارة الطبيب المختص للحصول على تشخيص طبي

## تعليمات الرد:
يجب أن يكون ردك دائماً بصيغة JSON فقط بالهيكل التالي (بدون أي نص خارج الـ JSON):

{
  "botMessage": "رسالتك الرئيسية للمستخدم بأسلوب طبيعي وودود",
  "suggestedRequestDescription": "وصف مقترح للطلب إذا كان المستخدم يريد طلب رعاية، وإلا null",
  "recommendedSpecialty": "اسم التخصص المقترح من القائمة فقط، وإلا null",
  "followUpQuestions": ["سؤال متابعة 1", "سؤال متابعة 2"],
  "intent": "improve_care_request | recommend_caregiver_specialty | app_usage_support | general_question"
}

## أمثلة على نبرة الرد:
- بدلاً من: "تم استلام طلبك" → قل: "وصلني طلبك! 😊 هخليك توصل لأفضل مقدم رعاية"
- بدلاً من: "لا أستطيع تقديم تشخيص" → قل: "أنا مش طبيب وما أقدر أحكم على حالتك، بس أقدر أساعدك توصل للمتخصص الصح"
`.trim();
};

// Call OpenRouter API with conversation history

const callOpenRouter = async (messages, specialties) => {
  const systemPrompt = buildSystemPrompt(specialties);

  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  };

  const response = await axios.post(OPENROUTER_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": process.env.APP_NAME || "Care App Chatbot",
    },
    timeout: 30000,
  });

  const rawContent = response.data.choices[0].message.content;

  // Parse JSON response from AI
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    // Fallback if AI doesn't return valid JSON
    parsed = {
      botMessage: rawContent || "عذراً، حدث خطأ في المعالجة. حاول مرة أخرى.",
      suggestedRequestDescription: null,
      recommendedSpecialty: null,
      followUpQuestions: [],
      intent: "general_question",
    };
  }

  // Validate & sanitize the response
  return {
    botMessage: parsed.botMessage || "عذراً، لم أفهم طلبك. ممكن تعيد الصياغة؟",
    suggestedRequestDescription: parsed.suggestedRequestDescription || null,
    recommendedSpecialty: parsed.recommendedSpecialty || null,
    followUpQuestions: Array.isArray(parsed.followUpQuestions)
      ? parsed.followUpQuestions.slice(0, 3)
      : [],
    intent: [
      "improve_care_request",
      "recommend_caregiver_specialty",
      "app_usage_support",
      "general_question",
    ].includes(parsed.intent)
      ? parsed.intent
      : "general_question",
  };
};

module.exports = { callOpenRouter };
