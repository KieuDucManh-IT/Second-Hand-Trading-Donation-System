const nodemailer = require("nodemailer");
const dns = require("dns");

// Ép Node.js ưu tiên IPv4 (fix lỗi ENETUNREACH IPv6 trên Render)
dns.setDefaultResultOrder("ipv4first");

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

    // Phân giải smtp.gmail.com sang IPv4 trước để tránh Render kết nối IPv6
    let smtpHost = "smtp.gmail.com";
    try {
      const ipv4Addresses = await dns.promises.resolve4("smtp.gmail.com");
      if (ipv4Addresses && ipv4Addresses.length > 0) {
        smtpHost = ipv4Addresses[0];
        console.log("Resolved smtp.gmail.com to IPv4:", smtpHost);
      }
    } catch (dnsErr) {
      console.warn("DNS resolve4 failed, fallback to hostname:", dnsErr.message);
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        servername: "smtp.gmail.com", // Cần cho xác thực TLS khi dùng IP thay hostname
        rejectUnauthorized: true
      }
    });

    await transporter.verify();
    console.log("Gmail SMTP is ready (IPv4)");

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