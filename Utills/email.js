const nodemailer = require("nodemailer");

/**
 * Sends an email using nodemailer + Gmail.
 *
 * @param {Object} options
 * @param {string} options.email   - Recipient's email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Plain-text body
 */
const sendEmail = async (options) => {
  // STEP 1 ── Create the transporter (the "postman" that hands off to Gmail)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME, // your Gmail address in .env
      pass: process.env.EMAIL_PASSWORD, // Gmail App Password in .env
      //
      // How to get an App Password:
      //   1. Enable 2-Step Verification on your Google account
      //   2. Go to myaccount.google.com/apppasswords
      //   3. Generate a password and paste it in EMAIL_PASSWORD in your .env
    },
  });

  // STEP 2 ── Define email options
  const mailOptions = {
    from: `"Ehtmam Team" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // STEP 3 ── Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;