const BREVO_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_USER;
  const senderName =
    process.env.BREVO_SENDER_NAME || "Second-Hand Trading and Donation System";

  if (!apiKey) {
    throw new Error("Thiếu biến môi trường BREVO_API_KEY");
  }

  if (!senderEmail) {
    throw new Error("Thiếu biến môi trường EMAIL_USER");
  }

  const recipients = (Array.isArray(to) ? to : [to]).map(
    (email) => ({ email })
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(BREVO_EMAIL_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: recipients,
        subject,
        htmlContent: html
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Lỗi khi gửi email:", data);

      throw new Error(
        data.message ||
          `Lỗi HTTP ${response.status}`
      );
    }

    console.log("Email sent:", data.messageId);

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Dịch vụ gửi email không phản hồi"
      );
    }

    console.error("Lỗi khi gửi email:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = sendEmail;