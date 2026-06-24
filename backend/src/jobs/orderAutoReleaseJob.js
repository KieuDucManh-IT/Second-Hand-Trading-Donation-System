const escrowService = require("../services/escrowService");
 
const INTERVAL_MS = 60 * 60 * 1000; // mỗi 1 giờ
 
async function run() {
  try {
    const result = await escrowService.autoReleaseExpiredOrders();
    if (result.total > 0) {
      console.log(`[orderAutoRelease] ${new Date().toISOString()} –`, result);
    }
  } catch (err) {
    console.error("[orderAutoRelease] ERROR:", err.message);
  }
}
 
// Chạy ngay lần đầu khi khởi động
run();
 
// Sau đó lặp lại theo interval
setInterval(run, INTERVAL_MS);
 
module.exports = { run };