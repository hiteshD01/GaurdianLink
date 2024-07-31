const Payment = require("../models/Payment");
const Hardware = require("../models/Hardware");

exports.buyHardware = (req, res) => {
  const { item_quantity, address, access_token } = req.body;
  try {
    const paymentUrl = `https://gaurdianlink-admin.netlify.app/request-hardware?qty=${item_quantity}&address=${encodeURIComponent(
      address
    )}&token=${access_token}`;

    res.status(200).json({ paymentUrl: paymentUrl });
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
