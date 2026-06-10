const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./src/config/db");
const authRoute = require("./src/routes/authRoute");
const productRoute = require("./src/routes/productRoute");
const categoryRoute = require("./src/routes/categoryRoute");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend API is running");
});

app.use("/api/auth", authRoute);
app.use("/api/products",   productRoute);
app.use("/api/categories", categoryRoute);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();