const { required } = require("joi");
const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  lat: { type: String, required: true },
  long: { type: String, required: true },
  address: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["sos", "start_trip", "end_trip"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Location", locationSchema);
