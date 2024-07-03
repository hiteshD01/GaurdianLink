const PrivacyPolicy = require("../models/PrivacyPolicy");

exports.createOrReplacePrivacyPolicy = async (req, res) => {
  const { title, description } = req.body;

  try {
    let privacyPolicy = await PrivacyPolicy.findOne();

    if (!privacyPolicy) {
      privacyPolicy = new PrivacyPolicy({ title, description });
    } else {
      privacyPolicy.title = title;
      privacyPolicy.description = description;
    }

    const savedPrivacyPolicy = await privacyPolicy.save();
    res.status(201).json(savedPrivacyPolicy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getPrivacyPolicy = async (req, res) => {
  try {
    const privacyPolicy = await PrivacyPolicy.findOne();
    if (!privacyPolicy) {
      return res.status(404).json({ message: "Privacy policy not found" });
    }
    res.status(200).json(privacyPolicy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
