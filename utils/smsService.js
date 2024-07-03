const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP sent: " + info.response);
  } catch (error) {
    console.error("Error sending OTP: ", error);
    throw new Error("Failed to send OTP");
  }
};

module.exports = { sendOTP };
