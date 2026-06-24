const cron = require("node-cron");
const {
  autoReleaseExpiredOrders,
} = require("../services/escrowService");

function startOrderAutoReleaseJob() {
  // Chạy mỗi giờ để kiểm tra giải ngân tự động
  cron.schedule("30 * * * *", async () => {
    try {
      console.log("Running order auto release job...");

      const result = await autoReleaseExpiredOrders();

      console.log("Order auto release result:", result);
    } catch (error) {
      console.error("Order auto release job error:", error);
    }
  });

  console.log("Order auto release job started");
}

module.exports = {
  startOrderAutoReleaseJob,
};
