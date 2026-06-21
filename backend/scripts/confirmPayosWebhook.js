require("dotenv").config();
const path = require("path");

// Đảm bảo đọc đúng file backend/.env
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const webhookUrl = process.argv[2];

if (!webhookUrl) {
  console.log("Thiếu webhook URL");
  console.log("Ví dụ:");
  console.log(
    "node scripts/confirmPayosWebhook.js https://crept-corporal-frightful.ngrok-free.dev/api/webhooks/payos"
  );
  process.exit(1);
}

async function main() {
  try {
    console.log("Confirm webhook URL:", webhookUrl);

    const res = await fetch("https://api-merchant.payos.vn/confirm-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.PAYOS_CLIENT_ID,
        "x-api-key": process.env.PAYOS_API_KEY,
      },
      body: JSON.stringify({
        webhookUrl: webhookUrl,
      }),
    });

    const text = await res.text();

    console.log("HTTP status:", res.status);
    console.log("payOS response:", text);

    if (!res.ok) {
      console.log("Confirm webhook thất bại");
      process.exit(1);
    }

    console.log("Confirm webhook thành công");
  } catch (error) {
    console.error("Lỗi:", error.message);
    process.exit(1);
  }
}

main();