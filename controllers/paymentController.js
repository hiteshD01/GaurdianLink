const axios = require("axios");
const crypto = require("crypto");
const Hardware = require("../models/Hardware");
const Payment = require("../models/Payment");

exports.buyHardware = async (req, res) => {
  const { item_name, item_price, item_quantity } = req.body;
  const amount = item_price * item_quantity;

  const PF_MERCHANT_ID = "10000100"; 
  const PF_MERCHANT_KEY = "46f0cd694581a"; 
  const PF_RETURN_URL = "http://yourwebsite.com/return";
  const PF_CANCEL_URL = "http://yourwebsite.com/cancel";
  const PF_NOTIFY_URL = "http://yourwebsite.com/notify";

  const reference = crypto.randomBytes(16).toString("hex");

  const data = {
    merchant_id: PF_MERCHANT_ID,
    merchant_key: PF_MERCHANT_KEY,
    return_url: PF_RETURN_URL,
    cancel_url: PF_CANCEL_URL,
    notify_url: PF_NOTIFY_URL,
    name_first: req.user.first_name,
    name_last: req.user.last_name,
    email_address: req.user.email,
    m_payment_id: reference,
    amount: amount.toFixed(2),
    item_name: item_name,
    item_description: `Purchase of ${item_quantity} ${item_name}(s)`,
  };

  const signature = crypto.createHash('md5').update(Object.entries(data).map(([key, val]) => `${key}=${encodeURIComponent(val)}`).join("&")).digest('hex');

  data.signature = signature;

  try {
    const payment = new Payment({
      user_id: req.user._id,
      item_name: item_name,
      item_quantity: item_quantity,
      amount: amount,
      status: "pending",
      reference: reference,
    });

    await payment.save();

    res.status(200).json({
      payment_url: `https://sandbox.payfast.co.za/eng/process?${new URLSearchParams(data).toString()}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.paymentNotification = async (req, res) => {
  const { m_payment_id, payment_status } = req.body;

  try {
    const payment = await Payment.findOne({ reference: m_payment_id });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = payment_status;
    await payment.save();

    res.status(200).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
