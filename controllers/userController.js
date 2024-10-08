const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { registerValidation, loginValidation } = require("../utils/validation");
const Vehicle = require("../models/Vehicle");
const upload = require("../config/multerConfig");
const { uploadImageToAzure } = require("../utils/azureBlobService");
const { setresetPasswordMail } = require("../utils/resetPasswordService");
const Location = require("../models/Location");
const moment = require("moment");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const multer = require("multer");
const xlsx = require("xlsx");

// Multer configuration for Excel files
const excelStorage = multer.memoryStorage();
const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Not an Excel file! Please upload an Excel file."), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 10, // 10 MB
  },
});

exports.registerBulkDrivers = async (req, res) => {
  excelUpload.single("driversSheet")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Parse the Excel file
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const driverData = xlsx.utils.sheet_to_json(worksheet);

      // Validate each driver's data
      const requiredFields = ["first_name", "last_name", "email", "password"];
      const missingFields = [];

      // Check if any required fields are missing in any row
      driverData.forEach((driver, index) => {
        const missing = requiredFields.filter((field) => !driver[field]);
        if (missing.length > 0) {
          missingFields.push({
            row: index + 2, // Adding 2 since Excel row index starts from 1, and first row is header
            missingFields: missing,
          });
        }
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: "Missing required fields in the Excel sheet",
          missingFields,
        });
      }

      // Continue to register each driver
      const errors = [];
      const registeredDrivers = [];

      for (const driver of driverData) {
        const { first_name, last_name, email, password, ...otherData } = driver;

        // Check if email already exists
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          errors.push({ email, message: "Email already exists" });
          continue;
        }

        // Check if username already exists
        // const usernameExists = await User.findOne({ username });
        // if (usernameExists) {
        //   errors.push({ email, message: "Username already exists" });
        //   continue;
        // }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
          first_name,
          last_name,
          email,
          password: hashedPassword,
          role: "driver",
          ...otherData,
          access_token: jwt.sign(
            { _id: email, role: "driver" },
            process.env.JWT_SECRET,
            // { expiresIn: process.env.JWT_EXPIRES_IN }
          ),
          refresh_token: jwt.sign(
            { _id: email, role: "driver" },
            process.env.REFRESH_JWT_SECRET,
            // { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
          ),
        });

        try {
          const savedUser = await user.save();
          registeredDrivers.push(savedUser);

          // Send credentials via email
          const transporter = nodemailer.createTransport({
            service: "Gmail", // Or use another email service
            auth: {
              user: process.env.EMAIL, // Your email address
              pass: process.env.PASSWORD, // Your email password or app-specific password
            },
          });

          const mailOptions = {
            from: process.env.EMAIL,
            to: savedUser.email,
            subject: "Welcome to Gaurdian Link",
            text: `Hello ${savedUser.username},\n\nYour account has been created successfully!\n\nUsername: ${savedUser.email}\nPassword: ${password}\n\nPlease keep this information safe.\n\nBest regards.`,
          };

          await transporter.sendMail(mailOptions);
        } catch (saveError) {
          errors.push({ email, message: "Failed to register user" });
        }
      }

      // If there are errors, return a 400 response with the errors
      if (errors.length > 0) {
        return res
          .status(400)
          .json({ message: "Some drivers could not be registered", errors });
      }

      // If no errors, return the list of registered drivers
      res.status(201).json({ registeredDrivers });
    } catch (parseError) {
      res
        .status(500)
        .json({
          message: "Failed to parse Excel file",
          error: parseError.message,
        });
    }
  });
};

exports.register = async (req, res) => {
  upload.single("profileImage")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { error } = registerValidation(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists)
      return res.status(400).json({ message: "Email already exists" });

    // if (req.body.role === "driver") {
    //   const usernameExists = await User.findOne({
    //     username: req.body.username,
    //   });
    //   if (usernameExists)
    //     return res.status(400).json({ message: "Username already exists" });
    // }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    let uid = "";
    if (req.body.type === "google" || req.body.type === "facebook") {
      uid = req.body.uid || "";
    }

    let profileImageUrl = "";
    if (req.file) {
      try {
        const timestamp = Date.now();
        const fileName = `profile-images/${timestamp}-${req.file.originalname}`;
        profileImageUrl = await uploadImageToAzure(req.file.buffer, fileName);
      } catch (uploadError) {
        return res.status(500).json({
          message: "Failed to upload image to Azure Blob Storage",
          error: uploadError.message,
        });
      }
    }

    const user = new User({
      ...req.body,
      password: hashedPassword,
      uid,
      profileImage: profileImageUrl,
      access_token: jwt.sign(
        { _id: req.body.email, role: req.body.role },
        process.env.JWT_SECRET,
        // {
        //   expiresIn: process.env.JWT_EXPIRES_IN,
        // }
      ),
      refresh_token: jwt.sign(
        { _id: req.body.email, role: req.body.role },
        process.env.REFRESH_JWT_SECRET,
        // { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      ),
    });

    try {
      const savedUser = await user.save();
      const vehicle = await Vehicle.find({ user_id: savedUser._id });

      // Send credentials via email
      const transporter = nodemailer.createTransport({
        service: "Gmail", // Or use another email service
        auth: {
          user: process.env.EMAIL, // Your email address
          pass: process.env.PASSWORD, // Your email password or app-specific password
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: savedUser.email,
        subject: "Welcome to Gaurdian Link",
        text: `Hello ${
          (savedUser.first_name && savedUser.last_name) ||
          savedUser.company_name
        },\n\nYour account has been created successfully!\n\nUsername: ${
          savedUser.email
        }\nPassword: ${
          req.body.password
        }\n\nPlease keep this information safe.\n\nBest regards.`,
      };

      await transporter.sendMail(mailOptions);

      res.status(201).json({ user: savedUser, vehicle: vehicle || [] });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
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
      process.env.JWT_SECRET
      // { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.REFRESH_JWT_SECRET
      // { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    const vehicles = await Vehicle.find({ user_id: user._id });

    res.header("authorization", accessToken).json({
      accessToken,
      refreshToken,
      user,
      vehicles: vehicles || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkLogin = async (req, res) => {
  const { email, uid, fcm_token, username, type, role, ...rest } = req.body;

  if (!email || !uid) {
    return res.status(400).json({ message: "Email and UID are required" });
  }

  let user = await User.findOne({ email, uid });

  if (!user) {
    // User not found, create a new one
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      req.body.password || "defaultPassword",
      salt
    );

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { _id: uid, role: role },
      process.env.JWT_SECRET
      // { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { _id: uid, role: role },
      process.env.REFRESH_JWT_SECRET
      // { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    user = new User({
      email,
      uid,
      username, // Use the username from the body
      type, // Use the type from the body
      role, // Use the role from the body
      password: hashedPassword,
      fcm_token,
      access_token: accessToken, // Set access token
      refresh_token: refreshToken, // Set refresh token
      ...rest, // Include any other fields from the body
    });

    try {
      await user.save();
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Failed to create new user", error: err.message });
    }
  } else {
    // Update FCM token if provided
    if (fcm_token) {
      user.fcm_token = fcm_token;
      await user.save();
    }
  }

  try {
    const accessToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
      // { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.REFRESH_JWT_SECRET
      // { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    const vehicles = await Vehicle.find({ user_id: user._id });

    res.header("authorization", accessToken).json({
      accessToken,
      refreshToken,
      user,
      vehicles: vehicles || [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserByRole = async (req, res) => {
  const role = req.query.role;
  if (!role) return res.status(400).json({ message: "Role is required" });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = req.query.filter || "";
  const companyIdFilter = req.query.company_id;

  try {
    // Build the dynamic query object
    const query = {
      role,
      disable: { $ne: true },
      $or: [
        { company_name: { $regex: filter, $options: "i" } },
        { contact_name: { $regex: filter, $options: "i" } },
        { email: { $regex: filter, $options: "i" } },
        { username: { $regex: filter, $options: "i" } },
      ],
    };

    if (companyIdFilter) {
      query.company_id = new mongoose.Types.ObjectId(companyIdFilter);
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (!users.length)
      return (
        res
          // .status(404)
          .json(users)
      );

    const totalUsers = await User.countDocuments(query);

    let response = {
      users,
      totalUsers,
      page,
      totalPages: Math.ceil(totalUsers / limit),
    };

    if (role === "driver") {
      const totalActiveDrivers = await Location.countDocuments({ type: "sos" });
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
      const totalActiveDriversThisMonth = await Location.countDocuments({
        type: "sos",
        createdAt: { $gte: startOfMonth },
      });

      const today = moment().startOf("day").toDate();
      const endOfToday = moment().endOf("day").toDate();
      const yesterday = moment().subtract(1, "days").startOf("day").toDate();
      const endOfYesterday = moment().subtract(1, "days").endOf("day").toDate();
      const startOfWeek = moment().startOf("week").toDate();
      const startOfYear = moment().startOf("year").toDate();

      const totalActiveDriversToday = await Location.countDocuments({
        type: "sos",
        createdAt: { $gte: today, $lte: endOfToday },
      });

      const totalActiveDriversYesterday = await Location.countDocuments({
        type: "sos",
        createdAt: { $gte: yesterday, $lte: endOfYesterday },
      });

      const totalActiveDriversThisWeek = await Location.countDocuments({
        type: "sos",
        createdAt: { $gte: startOfWeek },
      });

      const totalActiveDriversThisYear = await Location.countDocuments({
        type: "sos",
        createdAt: { $gte: startOfYear },
      });

      response.totalActiveDrivers = totalActiveDrivers;
      response.totalActiveDriversThisMonth = totalActiveDriversThisMonth;
      response.totalActiveDriversToday = totalActiveDriversToday;
      response.totalActiveDriversYesterday = totalActiveDriversYesterday;
      response.totalActiveDriversThisWeek = totalActiveDriversThisWeek;
      response.totalActiveDriversThisYear = totalActiveDriversThisYear;
    }

    res.status(200).json(response);
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
    process.env.JWT_SECRET
    // { expiresIn: "1h" }
  );

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  try {
    await setresetPasswordMail(email, resetLink);
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reset link" });
  }
};

exports.resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const token = req.params.token;

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
    const vehicles = await Vehicle.find({ user_id: user._id });

    res.status(200).json({ user, vehicle: vehicles || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserById = async (req, res) => {
  upload.single("profileImage")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const userId = req.params.id;
    const updates = req.body;

    delete updates.password;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (req.file) {
        try {
          const timestamp = Date.now();
          const fileName = `profile-images/${timestamp}-${req.file.originalname}`;
          const profileImageUrl = await uploadImageToAzure(
            req.file.buffer,
            fileName
          );
          user.profileImage = profileImageUrl;
        } catch (uploadError) {
          return res.status(500).json({
            message: "Failed to upload image to Azure Blob Storage",
            error: uploadError.message,
          });
        }
      }

      Object.keys(updates).forEach((key) => {
        user[key] = updates[key];
      });

      const updatedUser = await user.save();
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
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
