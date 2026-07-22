const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
 
dotenv.config();
 
const connectDB = require("./src/config/db");
const authRoute = require("./src/routes/authRoute");
const managerRoute = require("./src/routes/managerRoute");
const productRoute = require("./src/routes/productRoute");
const categoryRoute = require("./src/routes/categoryRoute");
const reportRoute = require("./src/routes/reportRoute");
const chatRoute = require("./src/routes/chatRoute");
const orderRoutes = require("./src/routes/orderRoutes");
const walletRoutes = require("./src/routes/walletRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const exchangeEscrowRoutes = require("./src/routes/exchangeEscrowRoutes");
const { startOrderAutoReleaseJob } = require("./src/jobs/orderAutoReleaseJob");
const donationRoute = require("./src/routes/donationRoute");
const notificationRoute = require("./src/routes/notificationRoute");
 
const { initChatSocket } = require("./src/sockets/chatSocket");
const { startExchangeAutoReleaseJob } = require("./src/jobs/exchangeAutoReleaseJob");
 
const app = express();
 
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn("CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
 
app.get("/", (req, res) => res.send("Backend API is running"));
 
app.use("/api/auth", authRoute);
app.use("/api/manager", managerRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/location", require("./src/routes/manageLocationRoute"));
app.use("/api/products", productRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/reports", reportRoute);
app.use("/api/chat", chatRoute);
app.use("/api/wallet", walletRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/exchange-escrow", exchangeEscrowRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/donations", donationRoute);
app.use("/api/notifications", notificationRoute);
 
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
 
const io = initChatSocket(httpServer);
app.set("io", io);
global.__io = io;
 
const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExchangeAutoReleaseJob();
    startOrderAutoReleaseJob();
  });
};
 
startServer();