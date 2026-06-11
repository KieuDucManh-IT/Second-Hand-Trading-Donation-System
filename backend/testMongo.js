const mongoose = require("mongoose");
require("dotenv").config();

const testMongoConnection = async () => {
  try {
    console.log("Testing MongoDB connection...");

    if (!process.env.MONGO_URI) {
      console.log("MONGO_URI is missing in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connection successful!");
    console.log("Database name:", mongoose.connection.name);

    await mongoose.connection.close();
    console.log("MongoDB connection closed");

    process.exit(0);
  } catch (error) {
    console.log("MongoDB connection failed!");
    console.log("Error name:", error.name);
    console.log("Error message:", error.message);

    process.exit(1);
  }
};

testMongoConnection();