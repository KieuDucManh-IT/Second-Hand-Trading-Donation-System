const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
  {
    value: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
