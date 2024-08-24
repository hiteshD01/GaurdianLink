const Payment = require("../models/Payment");
const Hardware = require("../models/Hardware");
const User = require("../models/User");

exports.paymentSuccess = async (req, res) => {
  const { item_quantity, total_amount, status, delivery_address } = req.body;
  const user_id = req.user._id;

  try {
    const newPayment = new Payment({
      user_id,
      item_quantity,
      total_amount,
      status,
      delivery_address,
    });

    await newPayment.save();

    res
      .status(201)
      .json({ message: "Payment recorded successfully", payment: newPayment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.buyHardware = async (req, res) => {
//   const { item_quantity, address, access_token } = req.body;
//   const user = await User.findById(req.user._id);
//   try {
//     const paymentUrl = `https://gaurdianlink-admin.netlify.app/request-hardware?qty=${item_quantity}&address=${encodeURIComponent(
//       address
//     )}&token=${access_token}&username=${user.username}`;

//     res.status(200).json({ paymentUrl: paymentUrl });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.buyHardware = async (req, res) => {
  const { item_quantity, address1, address2, city, postal_code, access_token } =
    req.body;
  const user = await User.findById(req.user._id);

  try {
    // Fetch the hardware details
    const hardware = await Hardware.findOne();
    if (!hardware) {
      return res.status(404).json({ message: "Hardware not found" });
    }

    const { name, price } = hardware;

    // Construct the payment URL with additional parameters
    const paymentUrl = `https://gaurdianlink-admin.netlify.app/request-hardware?qty=${item_quantity}&address1=${encodeURIComponent(
      address1
    )}&address2=${encodeURIComponent(address2)}&city=${encodeURIComponent(
      city
    )}&postal_code=${postal_code}&token=${access_token}&username=${
      user.username
    }&product=${encodeURIComponent(name)}&price=${price}`;

    res.status(200).json({ paymentUrl: paymentUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const orders = await Payment.find()
      .populate("user_id", "-password")
      .skip(skip)
      .limit(limit);

    const totalOrders = await Payment.countDocuments();

    res.status(200).json({
      orders,
      totalOrders,
      page,
      totalPages: Math.ceil(totalOrders / limit)
    });
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
