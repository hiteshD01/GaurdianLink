const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendOTP } = require("../utils/smsService");
const { registerValidation, loginValidation } = require("../utils/validation");

exports.register = async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists)
    return res.status(400).json({ message: "Email already exists" });

  const usernameExists = await User.findOne({ username: req.body.username });
  if (usernameExists)
    return res.status(400).json({ message: "Username already exists" });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  const user = new User({
    ...req.body,
    password: hashedPassword,
    access_token: jwt.sign(
      { _id: req.body.email, role: req.body.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    ),
    refresh_token: jwt.sign(
      { _id: req.body.email, role: req.body.role },
      process.env.REFRESH_JWT_SECRET,
      { expiresIn: "7d" }
    ),
  });

  try {
    const savedUser = await user.save();
    res.status(201).json({ user: savedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).json({ message: "Email or password is wrong" });

  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).json({ message: "Invalid password" });

  const accessToken = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
  const refreshToken = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.REFRESH_JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.header("authorization", accessToken).json({
    accessToken,
    refreshToken,
  });
};

exports.getUserByRole = async (req, res) => {
  const role = req.query.role;
  if (!role) return res.status(400).json({ message: "Role is required" });

  try {
    const users = await User.find({ role });
    if (!users.length)
      return res.status(404).json({ message: "No users found with this role" });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();

  user.resetPasswordOTP = otp;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  try {
    await sendOTP(email, otp);
    res
      .status(200)
      .json({ message: "OTP sent to your registered email address" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res
      .status(400)
      .json({ message: "Email, OTP, and new password are required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.resetPasswordOTP !== otp || Date.now() > user.resetPasswordExpires)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({ message: "Password reset successful" });
};

exports.getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserById = async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
    });

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.disable = true;
    const disabledUser = await user.save();
    res
      .status(200)
      .json({ message: "User disabled successfully", user: disabledUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
