const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {},
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("Conversation", conversationSchema);
