const cron = require("node-cron");
const { autoReleaseExpiredOrders, autoCancelExpiredPendingOrders } = require("../services/escrowService");

let jobStarted = false;

async function runOrderAutoReleaseJob() {
  try {
    console.log("Running order auto release job...");
    const result = await autoReleaseExpiredOrders();
    if (result?.total > 0) {
      console.log("[orderAutoRelease]", new Date().toISOString(), result);
    }
    return result;
  } catch (error) {
    console.error("Order auto release job error:", error.message || error);
    return null;
  }
}

async function runAutoCancelPendingJob() {
  try {
    const result = await autoCancelExpiredPendingOrders();
    if (result?.cancelled > 0) {
      console.log("[autoCancelPending]", new Date().toISOString(), result);
    }
    return result;
  } catch (error) {
    console.error("Auto cancel pending job error:", error.message || error);
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
  runAutoCancelPendingJob();

  cron.schedule("30 * * * *", async () => {
    await runOrderAutoReleaseJob();
  });

  cron.schedule("*/30 * * * *", async () => {
    await runAutoCancelPendingJob();
  });

  console.log("Order auto release job started");
}

module.exports = {
  startOrderAutoReleaseJob,
  runOrderAutoReleaseJob,
  runAutoCancelPendingJob,
};