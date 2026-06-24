const cron = require("node-cron");
const { autoReleaseExpiredOrders } = require("../services/escrowService");

let jobStarted = false;

async function runOrderAutoReleaseJob() {
  try {
    console.log("Running order auto release job...");

    const result = await autoReleaseExpiredOrders();

    if (result?.total > 0) {
      console.log("[orderAutoRelease]", new Date().toISOString(), result);
    } else {
      console.log("Order auto release result:", result);
    }

    return result;
  } catch (error) {
    console.error("Order auto release job error:", error.message || error);
    return null;
  }
}

function startOrderAutoReleaseJob() {
  if (jobStarted) {
    console.log("Order auto release job already started");
    return;
  }

  jobStarted = true;

  runOrderAutoReleaseJob();

  cron.schedule("30 * * * *", async () => {
    await runOrderAutoReleaseJob();
  });

  console.log("Order auto release job started");
}

module.exports = {
  startOrderAutoReleaseJob,
  runOrderAutoReleaseJob,
};