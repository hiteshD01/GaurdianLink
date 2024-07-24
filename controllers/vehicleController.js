const Vehicle = require("../models/Vehicle");
const upload = require("../config/multerConfig");
const { uploadImageToAzure } = require("../utils/azureBlobService");

exports.createVehicle = (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { vehicle_name, reg_no, type, user_id } = req.body;

    if (!vehicle_name || !reg_no || !type || !user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const images = {};

    for (const file of req.files) {
      const timestamp = Date.now();
      const fileName = `vehicle-images/${timestamp}-${file.originalname}`;
      try {
        images[file.fieldname] = await uploadImageToAzure(
          file.buffer,
          fileName
        );
      } catch (uploadError) {
        return res.status(500).json({
          message: "Failed to upload image to Azure Blob Storage",
          error: uploadError.message,
        });
      }
    }

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
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "user_id",
      "-password"
    );
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
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { vehicle_name, reg_no, type } = req.body;
    const updateData = {
      vehicle_name,
      reg_no,
      type,
    };

    const imagesToUpdate = {};

    for (const file of req.files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      try {
        imagesToUpdate[file.fieldname] = await uploadImageToAzure(
          file.buffer,
          fileName
        );
      } catch (uploadError) {
        return res.status(500).json({
          message: "Failed to upload image to Azure Blob Storage",
          error: uploadError.message,
        });
      }
    }

    if (Object.keys(imagesToUpdate).length > 0) {
      updateData.$set = imagesToUpdate;
    }

    try {
      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.status(200).json({ vehicle: updatedVehicle });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
};
