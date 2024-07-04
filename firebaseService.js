const admin = require("firebase-admin");
const serviceAccount = require("./gaurdianlink-c8cf0-firebase-adminsdk-wqeyn-c46e7c9e70.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gaurdianlink-c8cf0.firebaseio.com",
});

const db = admin.database();
const fcm = admin.messaging();

module.exports = { db, fcm };
