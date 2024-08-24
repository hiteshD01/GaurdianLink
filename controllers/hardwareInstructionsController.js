const HardwareInstructions = require("../models/HardwareInstructions");

exports.createOrReplaceHardwareInstructions = async (req, res) => {
  const { title, description } = req.body;

  try {
    let hardwareInstructions = await HardwareInstructions.findOne();

    if (!hardwareInstructions) {
      hardwareInstructions = new HardwareInstructions({ title, description });
    } else {
      hardwareInstructions.title = title;
      hardwareInstructions.description = description;
    }

    const savedTermsAndConditions = await hardwareInstructions.save();
    res.status(201).json(savedTermsAndConditions);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getHardwareInstructions = async (req, res) => {
  try {
    const hardwareInstructions = await HardwareInstructions.findOne();
    if (!hardwareInstructions) {
      return res.status(404).json({ message: "Terms and conditions not found" });
    }
    res.status(200).json(hardwareInstructions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
