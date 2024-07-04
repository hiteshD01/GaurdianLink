const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

const authorized = [verifyToken, authorizeRoles("driver", "company", "super_admin")];

router.post("/sos", authorized, locationController.createSOS);
router.get("/", authorized, locationController.getAllLocations);
router.get("/hotspot", authorized, locationController.getHotspots);

module.exports = router;
