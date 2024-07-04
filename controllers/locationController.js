const Location = require("../models/Location");
const User = require("../models/User");
const { fcm, db } = require("../firebaseService");
const sendNotification = require("../utils/sendNotification");

exports.createSOS = async (req, res) => {
    const { lat, long, address } = req.body;
    const userId = req.user._id;
  
    try {
      const location = new Location({ lat, long, address, user_id: userId });
      await location.save();
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const message = 'Emergency! Please check the location and assist if needed.';
      await sendNotification(user.contacts, message);
  
      res.status(201).json({ message: 'SOS signal sent and notification dispatched.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

// exports.createSOS = async (req, res) => {
//   const { lat, long, address } = req.body;

//   const newLocation = new Location({
//     lat,
//     long,
//     address,
//     user_id: req.user._id,
//   });

//   try {
//     const savedLocation = await newLocation.save();
//     res.status(201).json(savedLocation);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate("user_id", "-password");
    res.status(200).json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHotspots = async (req, res) => {
  try {
    const locations = await Location.aggregate([
      {
        $group: {
          _id: { lat: "$lat", long: "$long", address: "$address" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    res.status(200).json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
