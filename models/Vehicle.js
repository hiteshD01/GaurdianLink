const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  vehicle_name: {
    type: String,
    required: true,
  },
  reg_no: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  images: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
