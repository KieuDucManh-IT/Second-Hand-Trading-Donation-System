const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const connectDB = require("./src/config/db");
const authRoute = require("./src/routes/authRoute");
const managerRoute = require("./src/routes/managerRoute");
const productRoute = require("./src/routes/productRoute");
const categoryRoute = require("./src/routes/categoryRoute");
const reportRoute = require("./src/routes/reportRoute");
const walletRoutes = require("./src/routes/walletRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const exchangeEscrowRoutes = require("./src/routes/exchangeEscrowRoutes");
const { startExchangeAutoReleaseJob } = require("./src/jobs/exchangeAutoReleaseJob");

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

app.use("/api/wallet", walletRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/exchange-escrow", exchangeEscrowRoutes);
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExchangeAutoReleaseJob();
  });
};

startServer();
