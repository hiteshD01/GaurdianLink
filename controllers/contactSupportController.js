const ContactSupport = require("../models/ContactSupport");

exports.createOrReplaceContactSupport = async (req, res) => {
  const { title, details, contact_number, contact_email, contact_website } = req.body;

  try {
    let contactSupport = await ContactSupport.findOne();

    if (!contactSupport) {
      contactSupport = new ContactSupport({ title, details, contact_number, contact_email, contact_website });
    } else {
      contactSupport.title = title;
      contactSupport.details = details;
      contactSupport.contact_number = contact_number;
      contactSupport.contact_email = contact_email;
      contactSupport.contact_website = contact_website;
    }

    const savedPrivacyPolicy = await contactSupport.save();
    res.status(201).json(savedPrivacyPolicy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getContactSupport = async (req, res) => {
  try {
    const contactSupport = await ContactSupport.findOne();
    if (!contactSupport) {
      return res.status(404).json({ message: "Privacy policy not found" });
    }
    res.status(200).json(contactSupport);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
