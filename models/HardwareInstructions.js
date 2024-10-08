const mongoose = require("mongoose");

const hardwareInstructionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("HardwareInstruction", hardwareInstructionSchema);
