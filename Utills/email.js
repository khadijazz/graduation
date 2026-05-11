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
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME, 
      pass: process.env.EMAIL_PASSWORD, 
     
    },
  });
  const mailOptions = {
    from: `"Ehtmam Team" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;