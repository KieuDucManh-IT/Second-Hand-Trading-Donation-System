const cron = require("node-cron");
const {
  autoReleaseExpiredExchangeInvoices,
} = require("../services/exchangeEscrowService");

function startExchangeAutoReleaseJob() {
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running exchange auto release job...");

      const result = await autoReleaseExpiredExchangeInvoices();

      console.log("Exchange auto release result:", result);
    } catch (error) {
      console.error("Exchange auto release job error:", error);
    }
  });

  console.log("Exchange auto release job started");
}

module.exports = {
  startExchangeAutoReleaseJob,
};