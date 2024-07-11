const Payment = require("../models/Payment");
const Hardware = require("../models/Hardware");

exports.buyHardware = async (req, res) => {
  const { item_quantity, status } = req.body;

  const hardware = await Hardware.find();
  const { name, price } = hardware[0];

  const amount = price * item_quantity;

  try {
    const payment = new Payment({
      user_id: req.user._id,
      item_name: name,
      item_quantity: item_quantity,
      item_price: price,
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
  const { item_quantity, status } = req.body;

  const hardware = await Hardware.find();
  const { name, price } = hardware[0];

  const amount = price * item_quantity;

  const updateData = {
    item_name: name,
    item_quantity: item_quantity,
    item_price: price,
    total_amount: amount,
    status: status
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
