const axios = require("axios");
const crypto = require("crypto");
const Hardware = require("../models/Hardware");
const Payment = require("../models/Payment");

exports.buyHardware = async (req, res) => {
  const { item_name, item_price, item_quantity, status } = req.body;
  const amount = item_price * item_quantity;

  try {
    const payment = new Payment({
      user_id: req.user._id,
      item_name: item_name,
      item_quantity: item_quantity,
      item_price: item_price,
      total_amount: amount,
      status: status,
    });

    await payment.save();

    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const order = await Payment.find().populate("user_id", "-password");
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  const { item_name, item_price, item_quantity, status } = req.body;
  const amount = item_price * item_quantity;

  const updateData = {
    // user_id: req.user._id,
    item_name: item_name,
    item_quantity: item_quantity,
    item_price: item_price,
    total_amount: amount,
    status: status,
  };

  try {
    const updatedOrder = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ order: updatedOrder });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
