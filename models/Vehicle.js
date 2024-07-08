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
  image_1: {
    type: String,
  },
  image_2: {
    type: String,
  },
  image_3: {
    type: String,
  },
  image_4: {
    type: String,
  },
  image_5: {
    type: String,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
