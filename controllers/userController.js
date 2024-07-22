const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendOTP } = require("../utils/smsService");
const { registerValidation, loginValidation } = require("../utils/validation");
const Vehicle = require("../models/Vehicle");


exports.register = async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists)
    return res.status(400).json({ message: "Email already exists" });

  if (req.body.role === "driver") {
    const usernameExists = await User.findOne({ username: req.body.username });
    if (usernameExists)
      return res.status(400).json({ message: "Username already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  let uid = "";
  if (req.body.type === "google" || req.body.type === "facebook") {
    uid = req.body.uid || "";
  }

  const user = new User({
    ...req.body,
    password: hashedPassword,
    uid,
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
    const vehicle = await Vehicle.find({ user_id: savedUser._id });
    res.status(201).json({ user: savedUser, vehicle: vehicle || [] });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.login = async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password, fcm_token } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Email or password is wrong" });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ message: "Invalid password" });

  if (fcm_token) {
    user.fcm_token = fcm_token;
  }

  try {
    await user.save();

    const accessToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.REFRESH_JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    const vehicles = await Vehicle.find({ user_id: user._id });

    res.header("authorization", accessToken).json({
      accessToken,
      refreshToken,
      user,
      vehicles: [vehicles] || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkLogin = async (req, res) => {
  const { email, uid } = req.body;

  if (!email || !uid) {
    return res.status(400).json({ message: "Email and UID are required" });
  }

  const user = await User.findOne({ email, uid });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const accessToken = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.REFRESH_JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  const vehicles = await Vehicle.find({ user_id: user._id });

  res.header("authorization", accessToken).json({
    accessToken,
    refreshToken,
    user,
    vehicles: [vehicles] || [],
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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  try {
    await sendOTP(
      email,
      `Please click the following link to reset your password: ${resetLink}`
    );
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reset link" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res
      .status(400)
      .json({ message: "Token and new password are required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
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
