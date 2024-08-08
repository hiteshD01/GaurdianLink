const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const session = require("express-session");
const cors = require("cors");
var admin = require("firebase-admin");
var serviceAccount = require("./gaurdian-link-firebase-adminsdk-xp22h-cb5a85fb8d.json");
dotenv.config();

connectDB();

const app = express();
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

const userRoutes = require("./routes/userRoutes");
const hardwareRoutes = require("./routes/hardwareRoutes");
const termsAndConditionsRoutes = require("./routes/termsAndConditionsRoutes");
const privacyPolicyRoutes = require("./routes/privacyPolicyRoutes");
const vehicleRouters = require("./routes/vehicleRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const locationRoutes = require("./routes/locationRoutes");
const contactSupportRoutes = require("./routes/contactSupportRoutes");

app.get("/", (req, res) => {
  res.send("Hey there!! Welcome to Gaurdian Link APIs");
});

app.use("/api/users", userRoutes);
app.use("/api/hardware", hardwareRoutes);
app.use("/api/terms-and-conditions", termsAndConditionsRoutes);
app.use("/api/privacy-policy", privacyPolicyRoutes);
app.use("/api/vehicle", vehicleRouters);
app.use("/api/payment", paymentRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/contact-support", contactSupportRoutes);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/google",
    },
    (accessToken, refreshToken, profile, callback) => {
      callback(null, profile);
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/facebook",
      profileFields: ["emails", "displayName", "name", "picture"],
    },
    (accessToken, refreshToken, profile, callback) => {
      callback(null, profile);
    }
  )
);

passport.serializeUser((user, callback) => {
  callback(null, user);
});

passport.deserializeUser((user, callback) => {
  callback(null, user);
});

app.use(
  session({
    secret: "gaurdianapp",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile email"] })
);
app.get(
  "/login/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get("/google", passport.authenticate("google"), (req, res) => {
  res.redirect("/");
});
app.get("/facebook", passport.authenticate("facebook"), (req, res) => {
  res.redirect("/");
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECTID,
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));
