const axios = require("axios");
const Location = require("../models/Location");

exports.createSOS = async (req, res) => {
  const { lat, long, address, type, fcmToken } = req.body;

  const newLocation = new Location({
    lat,
    long,
    address,
    type,
    user_id: req.user._id,
  });

  try {
    const savedLocation = await newLocation.save();

    if (fcmToken) {
      const fcmServerKey = process.env.FCM_SERVER_KEY;
      const notificationPayload = {
        to: fcmToken,
        notification: {
          body: "This is testing notification",
          title: "Test new Notification",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        data: {
          body: "This is testing notification",
          title: "Test new Notification",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      };
      
      const response = await axios.post(
        "https://fcm.googleapis.com/fcm/send",
        notificationPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${fcmServerKey}`,
          },
        }
      );

      if (response.status === 200) {
        console.log("Notification sent successfully");
      } else {
        console.error("Failed to send notification", response.data);
      }
    }
    res.status(201).json(savedLocation);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
