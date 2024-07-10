const Hardware = require("../models/Hardware");

exports.createOrReplaceHardware = async (req, res) => {
  const { name, image, description, price } = req.body;

  try {
    let hardware = await Hardware.findOne();

    if (!hardware) {
      hardware = new Hardware({ name, image, description, price });
    } else {
      hardware.name = name;
      hardware.image = image;
      hardware.description = description;
      hardware.price = price;
    }

    const savedHardware = await hardware.save();
    res.status(201).json(savedHardware);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllHardware = async (req, res) => {
  try {
    const hardware = await Hardware.find();
    res.status(200).json(hardware);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
