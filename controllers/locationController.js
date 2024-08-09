const Location = require("../models/Location");
const moment = require("moment");
const { getMessaging } = require("firebase-admin/messaging");

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

    const message = {
      notification: {
        title: "Help !!",
        body: "I am in trouble! Please help me.",
      },
      token: fcmToken,
    };

    getMessaging()
      .send(message)
      .then(() => {
        res.status(200).json({
          message: "Successfully sent message",
          token: fcmToken,
          savedLocation,
        });
      })
      .catch((error) => {
        res.status(400);
        res.send(error);
        console.log("Error sending message:", error);
      });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

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
      { $match: { "userDetails.disable": { $ne: true } } },
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
  const { type } = req.query;

  let dateRange;
  const today = moment().startOf("day");
  const endOfToday = moment().endOf("day");

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
    if (dateRange) {
      matchCriteria.createdAt = dateRange;
    }

    const hotspots = await Location.aggregate([
      { $match: matchCriteria },
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

    if (hotspots.length === 0) {
      return res.status(200).json([]);
    }

    const topCount = hotspots[0].count;

    const hotspotsWithPercentage = hotspots.map((hotspot) => ({
      lat: hotspot._id.lat,
      long: hotspot._id.long,
      address: hotspot._id.address,
      percentage: ((hotspot.count / topCount) * 100).toFixed(2),
      timesCalled: hotspot.count,
    }));

    res.status(200).json(hotspotsWithPercentage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
