const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
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
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },
  share_contacts: {
    type: Number,
    enum: [0, 1],
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
  auto_app_update: {
    type: Number,
    enum: [0, 1],
  },
  id_no: {
    type: Number,
  },
  social_app: {
    type: Number,
    enum: [0, 1],
  },
  company_bio: {
    type: String,
  },
  emergency_help: {
    type: Number,
    enum: [0, 1],
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
  deviceTokens: [
    {
      mobileNumber: { type: Number, required: true },
      token: { type: String, required: true },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
