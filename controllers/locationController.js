const axios = require("axios");
const Location = require("../models/Location");
// const { default: createMessage } = require("../utils/smsService");

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

    // // Fetch the user's emergency contacts
    // const user = await User.findById(req.user._id).select(
    //   "emergency_contact_1_contact emergency_contact_2_contact"
    // );

    // if (user) {
    //   const emergencyContacts = [
    //     user.emergency_contact_1_contact,
    //     user.emergency_contact_2_contact,
    //   ];

    //   const alertMessage = "This is an alert message from the SOS system.";

    //   // Send SMS to each emergency contact
    //   for (const contact of emergencyContacts) {
    //     if (contact) {
    //       await createMessage(alertMessage, contact);
    //     }
    //   }
    // }

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

exports.getLocationsByUser = async (req, res) => {
  const { start_date, end_date } = req.query;

  let filter = {
    user_id: req.user._id, // Filter by logged-in user's ID
    type: "sos", // Filter by location type "sos"
  };

  if (start_date && end_date) {
    filter.createdAt = {
      $gte: new Date(start_date),
      $lte: new Date(end_date),
    };
  }

  try {
    const locations = await Location.find(filter).populate(
      "user_id",
      "-password"
    );
    res.status(200).json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllLocations = async (req, res) => {
  const { start_date, end_date, type } = req.query;

  let filter = {};

  if (start_date && end_date) {
    filter.createdAt = {
      $gte: new Date(start_date),
      $lte: new Date(end_date),
    };
  }

  if (type === "sos") {
    filter.type = "sos";
  }

  try {
    const locations = await Location.find(filter).populate(
      "user_id",
      "-password"
    );
    res.status(200).json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRecentSosLocations = async (req, res) => {
  try {
    const recentSosLocations = await Location.aggregate([
      { $match: { type: "sos" } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user_id",
          mostRecentLocation: { $first: "$$ROOT" },
        },
      },
      { $sort: { "mostRecentLocation.createdAt": -1 } },
      { $limit: 5 },
      { $replaceRoot: { newRoot: "$mostRecentLocation" } },
    ]).exec();

    const populatedLocations = await Location.populate(recentSosLocations, {
      path: "user_id",
      select: "-password",
    });

    res.status(200).json(populatedLocations);
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
