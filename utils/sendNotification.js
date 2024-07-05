const admin = require("firebase-admin");
const User = require("../models/User");

const sendNotification = async (contacts, message) => {
  console.log({ contacts, message });

  const payload = {
    notification: {
      title: "Emergency Alert",
      body: message,
    },
  };

  try {
    const response = await admin
      .messaging()
      .sendToDevice(deviceTokens, payload);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

module.exports = sendNotification;
