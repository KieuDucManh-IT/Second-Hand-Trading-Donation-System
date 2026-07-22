const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const payOS = require("../src/config/payos");
const webhookUrl = process.argv[2];

if (!webhookUrl) {
  console.error("Thiếu webhook URL công khai.");
  console.error(
    "Ví dụ: node scripts/confirmPayosWebhook.js https://api.example.com/api/webhooks/payos"
  );
  process.exit(1);
}

if (!/^https:\/\//i.test(webhookUrl)) {
  console.error("Webhook production phải là URL HTTPS công khai.");
  process.exit(1);
}

async function main() {
  try {
    console.log("Đang đăng ký webhook:", webhookUrl);
    const result = await payOS.webhooks.confirm(webhookUrl);
    console.log("Đăng ký webhook thành công:", result);
  } catch (error) {
    console.error("Đăng ký webhook thất bại:", error.message);
    process.exit(1);
  }
}

main();
