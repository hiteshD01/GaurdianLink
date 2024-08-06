const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return next(); // Proceed to the controller without authentication
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id);
    if (!req.user) {
      return res.status(401).json({ message: "Invalid token." });
    }
    next(); // Proceed to the next middleware or controller with authentication
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = optionalAuth;
