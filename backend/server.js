const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

dotenv.config();

const connectDB = require("./src/config/db");
const authRoute = require("./src/routes/authRoute");
const productRoute = require("./src/routes/productRoute");
const categoryRoute = require("./src/routes/categoryRoute");
const chatRoute = require("./src/routes/chatRoute");
//const cartRoute  = require('./src/routes/cartRoute');
const orderRoute = require('./src/routes/orderRoute');

const { initChatSocket } = require("./src/sockets/chatSocket");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend API is running");
});

app.use("/api/auth", authRoute);
app.use("/api/products",   productRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/chat", chatRoute);
//app.use('/api/cart',   cartRoute);
app.use('/api/orders', orderRoute);

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
  });
};

startServer();