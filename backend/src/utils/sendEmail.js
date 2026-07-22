const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.verify();
    console.log("Gmail SMTP is ready");

    const info = await transporter.sendMail({
      from: `"Fashion Ecommerce" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Send email failed:");
    console.error(error);
    throw error;
  }
};

module.exports = sendEmail;