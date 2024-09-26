const mongoose = require("mongoose");

const contactSupportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  details: {
    type: String,
    required: true,
  },
  contact_number: {
    type: String,
    required: true,
  },
  contact_email: {
    type: String,
    required: true,
  },
  contact_website: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ContactSupport", contactSupportSchema);
