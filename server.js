const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const verifyToken = require("./middlewares/auth");

dotenv.config();

connectDB();

const app = express();

app.use(bodyParser.json());

const userRoutes = require("./routes/userRoutes");
const hardwareRoutes = require("./routes/hardwareRoutes");
const termsAndConditionsRoutes = require("./routes/termsAndConditionsRoutes");
const privacyPolicyRoutes = require("./routes/privacyPolicyRoutes");

app.use("/api/users", userRoutes);
app.use("/api/hardware", hardwareRoutes);
app.use("/api/terms-and-conditions", termsAndConditionsRoutes);
app.use("/api/privacy-policy", privacyPolicyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));