const TermsAndConditions = require("../models/TermsAndConditions");

exports.createOrReplaceTermsAndConditions = async (req, res) => {
  const { title, description } = req.body;

  try {
    let termsAndConditions = await TermsAndConditions.findOne();

    if (!termsAndConditions) {
      termsAndConditions = new TermsAndConditions({ title, description });
    } else {
      termsAndConditions.title = title;
      termsAndConditions.description = description;
    }

    const savedTermsAndConditions = await termsAndConditions.save();
    res.status(201).json(savedTermsAndConditions);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTermsAndConditions = async (req, res) => {
  try {
    const termsAndConditions = await TermsAndConditions.findOne();
    if (!termsAndConditions) {
      return res.status(404).json({ message: "Terms and conditions not found" });
    }
    res.status(200).json(termsAndConditions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
