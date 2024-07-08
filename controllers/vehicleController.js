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
}).fields([
  { name: "image_1", maxCount: 1 },
  { name: "image_2", maxCount: 1 },
  { name: "image_3", maxCount: 1 },
  { name: "image_4", maxCount: 1 },
  { name: "image_5", maxCount: 1 },
]);

exports.createVehicle = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    const { vehicle_name, reg_no, type, user_id } = req.body;

    if (!vehicle_name || !reg_no || !type || !user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const images = {
      image_1: req.files.image_1 ? req.files.image_1[0].path : null,
      image_2: req.files.image_2 ? req.files.image_2[0].path : null,
      image_3: req.files.image_3 ? req.files.image_3[0].path : null,
      image_4: req.files.image_4 ? req.files.image_4[0].path : null,
      image_5: req.files.image_5 ? req.files.image_5[0].path : null,
    };

    try {
      const vehicle = new Vehicle({
        vehicle_name,
        reg_no,
        type,
        ...images,
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

    const imagesToUpdate = {
      image_1: req.files.image_1 ? req.files.image_1[0].path : null,
      image_2: req.files.image_2 ? req.files.image_2[0].path : null,
      image_3: req.files.image_3 ? req.files.image_3[0].path : null,
      image_4: req.files.image_4 ? req.files.image_4[0].path : null,
      image_5: req.files.image_5 ? req.files.image_5[0].path : null,
    };

    // Remove null values from imagesToUpdate object
    Object.keys(imagesToUpdate).forEach(key => imagesToUpdate[key] === null && delete imagesToUpdate[key]);

    if (Object.keys(imagesToUpdate).length > 0) {
      updateData.$set = imagesToUpdate;
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
