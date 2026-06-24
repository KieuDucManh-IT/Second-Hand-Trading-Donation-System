const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");

dotenv.config();

const connectDB = require("./src/config/db");
const authRoute = require("./src/routes/authRoute");
const managerRoute = require("./src/routes/managerRoute");
const productRoute = require("./src/routes/productRoute");
const categoryRoute = require("./src/routes/categoryRoute");
const reportRoute = require("./src/routes/reportRoute");
const chatRoute = require("./src/routes/chatRoute");
const { initChatSocket } = require("./src/sockets/chatSocket");
const walletRoutes = require("./src/routes/walletRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const exchangeEscrowRoutes = require("./src/routes/exchangeEscrowRoutes");
const { startExchangeAutoReleaseJob } = require("./src/jobs/exchangeAutoReleaseJob");
const orderRoutes = require("./src/routes/orderRoutes");
const { startOrderAutoReleaseJob } = require("./src/jobs/orderAutoReleaseJob");
const donationRoute = require("./src/routes/donationRoute");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Backend API is running");
});

app.use("/api/auth", authRoute);
app.use("/api/manager", managerRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/location", require("./src/routes/manageLocationRoute"));
app.use("/api/products",   productRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/reports", reportRoute);
app.use("/api/chat", chatRoute);
app.use("/api/wallet", walletRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/exchange-escrow", exchangeEscrowRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/donations", donationRoute);


const PORT = process.env.PORT || 5000;

// Tạo HTTP server thủ công để gắn Socket.IO cùng với Express
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO và gắn vào app để các controller có thể emit (req.app.get('io'))
const io = initChatSocket(httpServer);
app.set("io", io);

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExchangeAutoReleaseJob();
    startOrderAutoReleaseJob();
  });
};

startServer();
