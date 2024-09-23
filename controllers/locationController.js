const Location = require("../models/Location");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const moment = require("moment");
const { getMessaging } = require("firebase-admin/messaging");
const { locationUpdateValidation } = require("../utils/validation");

function calculateDistance(lat1, long1, lat2, long2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLong = deg2rad(long2 - long1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

async function isValidFCMToken(token) {
  try {
    const message = {
      notification: {
        title: "Token Check",
        body: "This is a validation check.",
      },
      token: token,
    };

    await getMessaging().send(message, true);
    return true;
  } catch (error) {
    return false;
  }
}

exports.createSOS = async (req, res) => {
  const { lat, long, address, type, fcmToken } = req.body;

  const findUser = await User.findById(req.user._id);
  if (!findUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const userRadius = findUser.radius;

  // Create a new Location with default values for req_reach and req_accept
  const newLocation = new Location({
    lat,
    long,
    address,
    type,
    user_id: req.user._id,
    help_received: "",
    req_reach: 0,    // Set default value of 0 for req_reach
    req_accept: 0,   // Set default value of 0 for req_accept
  });

  try {
    const user = await User.findById(req.user._id);
    const vehicle = await Vehicle.find({ user_id: req.user._id });

    const drivers = await User.find({
      // role: "driver",
      current_lat: { $ne: null },
      current_long: { $ne: null },
      updatedAt: { $gte: moment().startOf("day").toDate() },
    });

    const validDrivers = [];

    for (const driver of drivers) {
      if (driver._id.equals(req.user._id)) {
        continue;
      }
      const distance = calculateDistance(
        lat,
        long,
        driver.current_lat,
        driver.current_long
      );

      if (distance <= userRadius && (await isValidFCMToken(driver.fcm_token))) {
        validDrivers.push(driver);
      }
    }

    if (validDrivers.length === 0) {
      return res.status(404).json({
        message: "No user found within your radius.",
      });
    }

    // Save new location with default values for req_reach and req_accept
    const savedLocation = await newLocation.save();

    // Send notification to valid drivers
    const sendMessages = validDrivers.map(async (driver) => {
      const initialMessage = {
        notification: {
          title: "Help !!",
          body: "I am in trouble! Please help me.",
        },
        token: driver.fcm_token,
        data: {
          title: "Help !!",
          body: "I am in trouble! Please help me.",
          type: "emergency_sos",
          location: JSON.stringify(savedLocation),
          user: JSON.stringify(user),
          vehicle: JSON.stringify(vehicle),
        },
      };

      await getMessaging().send(initialMessage);
    });

    await Promise.all(sendMessages);

    // Update req_reach after notifications are sent
    res.status(200).json({
      message: "Successfully sent initial message",
      token: fcmToken,
      savedLocation,
    });

    // Update req_reach with the number of drivers notified
    savedLocation.req_reach = validDrivers.length;
    await savedLocation.save();

    // Uncomment if you need to implement help_received tracking
    // const checkHelpReceived = setInterval(async () => {
    //   const updatedLocation = await Location.findById(savedLocation._id);
    //   if (updatedLocation.help_received !== "help_received") {
    //     clearInterval(checkHelpReceived);
    //     const followUpMessage = {
    //       notification: {
    //         title: "Accepted your request",
    //         body: "People coming soon to help",
    //       },
    //       token: fcmToken,
    //       data: {
    //         title: "Accepted your request",
    //         body: "People coming soon to help",
    //         type: "sos_request_count",
    //         location: JSON.stringify(updatedLocation),
    //         request_reach: updatedLocation.req_reach?.toString() || "0",
    //         request_accepted: updatedLocation.req_accept?.toString() || "0",
    //       },
    //     };

    //     getMessaging()
    //       .send(followUpMessage)
    //       .then(() => {
    //         console.log("Successfully sent follow-up message");
    //       })
    //       .catch((error) => {
    //         console.log("Error sending follow-up message:", error);
    //       });
    //   }
    // }, 1 * 60 * 1000); // Check every minute
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// exports.getLocationsByUser = async (req, res) => {
//   const { start_date, end_date } = req.query;

//   let filter = {
//     user_id: req.user._id, // Filter by logged-in user's ID
//     type: "sos", // Filter by location type "sos"
//   };

//   if (start_date && end_date) {
//     filter.createdAt = {
//       $gte: new Date(start_date),
//       $lte: new Date(end_date),
//     };
//   }

//   try {
//     const locations = await Location.aggregate([
//       { $match: filter },
//       {
//         $project: {
//           lat: {
//             $convert: {
//               input: "$lat",
//               to: "double",
//               onError: null,
//               onNull: null,
//             },
//           },
//           long: {
//             $convert: {
//               input: "$long",
//               to: "double",
//               onError: null,
//               onNull: null,
//             },
//           },
//           address: 1,
//           createdAt: 1,
//         },
//       },
//       {
//         $project: {
//           lat: { $round: ["$lat", 4] },  // Round lat to 4 decimal places
//           long: { $round: ["$long", 4] }, // Round long to 4 decimal places
//           address: 1,
//         },
//       },
//       {
//         $group: {
//           _id: { lat: "$lat", long: "$long" }, // Group by lat and long
//           address: { $first: "$address" },      // Take the first address from grouped records
//           count: { $sum: 1 },                   // Count occurrences
//         },
//       },
//       {
//         $sort: { count: -1 }, // Sort by count (number of times the hotspot has been called)
//       },
//     ]);

//     res.status(200).json(locations);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
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
    const { company_id } = req.user; // Assuming `req.user` contains the logged-in user's details

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
      {
        $lookup: {
          from: "users", // Ensure the correct collection name
          localField: "mostRecentLocation.user_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $match: {
          "userDetails.disable": { $ne: true },
          "userDetails.company_id": company_id, // Match the company ID
        },
      },
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
  const { type, start_date, end_date } = req.query;
  const today = moment().startOf("day");
  const endOfToday = moment().endOf("day");
  let dateRange;

  switch (type) {
    case "today":
      dateRange = { $gte: today.toDate(), $lte: endOfToday.toDate() };
      break;
    case "yesterday":
      const yesterday = today.subtract(1, "days");
      dateRange = {
        $gte: yesterday.startOf("day").toDate(),
        $lte: yesterday.endOf("day").toDate(),
      };
      break;
    case "thisWeek":
      dateRange = {
        $gte: today.startOf("week").toDate(),
        $lte: endOfToday.toDate(),
      };
      break;
    case "thisMonth":
      dateRange = {
        $gte: today.startOf("month").toDate(),
        $lte: endOfToday.toDate(),
      };
      break;
    case "thisYear":
      dateRange = {
        $gte: today.startOf("year").toDate(),
        $lte: endOfToday.toDate(),
      };
      break;
    default:
      dateRange = null;
  }

  try {
    let matchCriteria = { type: "sos" };

    // Add date range filtering if start_date and end_date are provided
    if (start_date && end_date) {
      matchCriteria.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      };
    } else if (dateRange) {
      matchCriteria.createdAt = dateRange;
    }

    const hotspots = await Location.aggregate([
      { $match: matchCriteria },
      {
        $project: {
          lat: {
            $convert: {
              input: "$lat",
              to: "double",
              onError: null,  // Handle conversion errors
              onNull: null,   // Handle null values
            },
          },
          long: {
            $convert: {
              input: "$long",
              to: "double",
              onError: null,
              onNull: null,
            },
          },
          address: 1,
          createdAt: 1,
        },
      },
      {
        $project: {
          lat: { $round: ["$lat", 4] },  // Round lat to 4 decimal places
          long: { $round: ["$long", 4] },  // Round long to 4 decimal places
          address: 1,
        },
      },
      {
        $group: {
          _id: { lat: "$lat", long: "$long" }, // Group only by lat and long
          address: { $first: "$address" },     // Take the first address from grouped records
          count: { $sum: 1 },                  // Count the occurrences of each unique lat/long pair
        },
      },
      {
        $sort: { count: -1 },  // Sort by the number of times the hotspot has been called
      },
    ]);

    if (hotspots.length === 0) {
      return res.status(200).json([]);
    }

    const hotspotsWithCount = hotspots.map((hotspot) => ({
      lat: hotspot._id.lat,
      long: hotspot._id.long,
      address: hotspot.address,  // Use the first address from the group
      timesCalled: hotspot.count,
    }));

    res.status(200).json(hotspotsWithCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.getHotspots = async (req, res) => {
//   const { type } = req.query;
//   const today = moment().startOf("day");
//   const endOfToday = moment().endOf("day");
//   let dateRange;

//   switch (type) {
//     case "today":
//       dateRange = { $gte: today.toDate(), $lte: endOfToday.toDate() };
//       break;
//     case "yesterday":
//       const yesterday = today.subtract(1, "days");
//       dateRange = {
//         $gte: yesterday.startOf("day").toDate(),
//         $lte: yesterday.endOf("day").toDate(),
//       };
//       break;
//     case "thisWeek":
//       dateRange = {
//         $gte: today.startOf("week").toDate(),
//         $lte: endOfToday.toDate(),
//       };
//       break;
//     case "thisMonth":
//       dateRange = {
//         $gte: today.startOf("month").toDate(),
//         $lte: endOfToday.toDate(),
//       };
//       break;
//     case "thisYear":
//       dateRange = {
//         $gte: today.startOf("year").toDate(),
//         $lte: endOfToday.toDate(),
//       };
//       break;
//     default:
//       dateRange = null;
//   }

//   try {
//     let matchCriteria = { type: "sos" };
//     if (dateRange) {
//       matchCriteria.createdAt = dateRange;
//     }

//     const hotspots = await Location.aggregate([
//       { $match: matchCriteria },
//       {
//         $project: {
//           lat: {
//             $convert: {
//               input: "$lat",
//               to: "double",
//               onError: null,  // Handle conversion errors
//               onNull: null,   // Handle null values
//             },
//           },
//           long: {
//             $convert: {
//               input: "$long",
//               to: "double",
//               onError: null,
//               onNull: null,
//             },
//           },
//           address: 1,
//           createdAt: 1,
//         },
//       },
//       {
//         $project: {
//           lat: { $round: ["$lat", 4] },  // Round lat to 4 decimal places
//           long: { $round: ["$long", 4] },  // Round long to 4 decimal places
//           address: 1,
//         },
//       },
//       {
//         $group: {
//           _id: { lat: "$lat", long: "$long" }, // Group only by lat and long
//           address: { $first: "$address" },     // Take the first address from grouped records
//           count: { $sum: 1 },                  // Count the occurrences of each unique lat/long pair
//         },
//       },
//       {
//         $sort: { count: -1 },  // Sort by the number of times the hotspot has been called
//       },
//     ]);

//     if (hotspots.length === 0) {
//       return res.status(200).json([]);
//     }

//     const hotspotsWithCount = hotspots.map((hotspot) => ({
//       lat: hotspot._id.lat,
//       long: hotspot._id.long,
//       address: hotspot.address,  // Use the first address from the group
//       timesCalled: hotspot.count,
//     }));

//     res.status(200).json(hotspotsWithCount);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.getSosRequestsPerMonth = async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res
      .status(400)
      .json({ message: "Start date and end date are required" });
  }

  try {
    const sosRequests = await Location.aggregate([
      {
        $match: {
          type: "sos",
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(end_date),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const result = sosRequests.map((item) => ({
      month: item._id,
      count: item.count,
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLocationById = async (req, res) => {
  try {
    const locationId = req.params.id;

    const { error, value } = locationUpdateValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { lat, long, address, type, req_reach, req_accept, help_received } =
      value;

    // Check if the location has help_received="help_received"
    const existingLocation = await Location.findById(locationId);
    if (!existingLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    if (req.user.role === "driver" && existingLocation.help_received === "help_received") {
      return res.status(400).json({ message: "Help received successfully." });
    }

    const updateFields = {};
    if (lat !== undefined) updateFields.lat = lat;
    if (long !== undefined) updateFields.long = long;
    if (address !== undefined) updateFields.address = address;
    if (type !== undefined) updateFields.type = type;
    if (req_reach !== undefined) updateFields.req_reach = req_reach;
    if (req_accept !== undefined) updateFields.$inc = { req_accept: 1 };
    if (help_received !== undefined) updateFields.help_received = help_received;

    const updatedLocation = await Location.findByIdAndUpdate(
      locationId,
      updateFields,
      { new: true }
    );

    if (!updatedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.status(200).json({
      message: "Location updated successfully",
      updatedLocation
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating location", error: err.message });
  }
};


exports.getLocationById = async (req, res) => {
  const locationId = req.params.id;
  try {
    const location = await Location.findById(locationId);

    // Check if the location has help_received="help_received"
    const existingLocation = await Location.findById(locationId);
    if (!existingLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    if (req.user.role === "driver" && existingLocation.help_received === "help_received") {
      return res.status(400).json({ message: "Help received successfully." });
    }
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.status(200).json(location);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error fetching location", error: err.message });
  }
};
