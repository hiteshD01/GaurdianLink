const admin = require("firebase-admin");
const User = require("../models/User");

const sendNotification = async (contacts, message) => {
  console.log({ contacts, message });
  const deviceTokens = [];

  for (const contact of contacts) {
    const users = await User.find({ "deviceTokens.mobileNumber": contact });
    console.log("users", users);

    users.forEach((user) => {
      user.deviceTokens.forEach((dt) => {
        if (dt.mobileNumber === contact) {
          deviceTokens.push(dt.token);
        }
      });
    });
  }

  if (deviceTokens.length === 0) {
    console.log("No device tokens found for contacts:", contacts);
    return;
  }

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
