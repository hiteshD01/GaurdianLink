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
  profileImage: {
    type: String,
  },
  type: {
    type: String,
    enum: ["email_pass", "google", "facebook"],
  },
  uid: {
    type: String,
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
  share_contacts: {
    type: Number,
    enum: [0, 1],
  },
  radius: {
    type: Number,
  },
  emergency_contact_1_email: {
    type: String,
  },
  emergency_contact_1_contact: {
    type: Number,
  },
  emergency_contact_2_email: {
    type: String,
  },
  emergency_contact_2_contact: {
    type: Number,
  },
  hardware_status: {
    type: String,
    enum: ["delivered", "order_received"],
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
  fcm_token: {
    type: String,
    // required: true,
  },
  current_lat: {
    type: String,
  },
  current_long: {
    type: String,
  },
  contact_name: {
    type: String,
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
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to automatically update the `updatedAt` field before each save
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);
