const Vehicle = require("../models/Vehicle");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  },
}).array("images", 5);

exports.createVehicle = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    const { vehicle_name, reg_no, type, user_id } = req.body;

    if (!vehicle_name || !reg_no || !type || !user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const images = req.files.map(file => file.path);

    try {
      const vehicle = new Vehicle({
        vehicle_name,
        reg_no,
        type,
        images,
        user_id,
      });

      const savedVehicle = await vehicle.save();
      res.status(201).json({ vehicle: savedVehicle });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("user_id", "-password");
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json(vehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("user_id", "-password");
    res.status(200).json(vehicles);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateVehicle = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    const { vehicle_name, reg_no, type } = req.body;
    const updateData = {
      vehicle_name,
      reg_no,
      type,
    };

    if (req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    try {
      const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.status(200).json({ vehicle: updatedVehicle });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
};
