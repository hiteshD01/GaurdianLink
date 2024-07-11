const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  item_quantity: {
    type: Number,
    required: true,
  },
  total_amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "not_received",
    enum: ["received", "cancel", "delivered", "order_received", "not_received"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
