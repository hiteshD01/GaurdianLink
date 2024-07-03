const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  role: {
    type: String,
    enum: ["driver", "company", "super_admin"],
    required: true,
  },
  company_name: {
    type: String,
  },
  mobile_no: {
    type: Number,
  },
  address: {
    type: String,
  },
  hardware: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hardware",
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  share_contacts: {
    type: Number,
  },
  radius: {
    type: Number,
  },
  contacts: {
    type: Array,
  },
  hardware_status: {
    type: String,
    enum: ["received", "cancel", "delivered", "order_received"],
  },
  trips: {
    type: Array,
  },
  auto_app_update: {
    type: Number,
  },
  id_no: {
    type: Number,
  },
  social_app: {
    type: Number,
  },
  company_bio: {
    type: String,
  },
  emergency_help: {
    type: Number,
  },
  access_token: {
    type: String,
    required: true,
  },
  refresh_token: {
    type: String,
    required: true,
  },
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  disable: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
