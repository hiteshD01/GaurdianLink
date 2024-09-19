const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

const authorized = [
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
];

router.post("/sos", authorized, locationController.createSOS);
// router.get("/", authorized, locationController.getLocationsByUser);
router.get("/", authorized, locationController.getHotspots);
router.get("/sos-location", authorized, locationController.getAllLocations);
router.get("/hotspot", authorized, locationController.getHotspots);
router.get(
  "/recent-sos-locations",
  authorized,
  locationController.getRecentSosLocations
);
router.get("/sos-month", locationController.getSosRequestsPerMonth);
router.put("/:id", authorized, locationController.updateLocationById);
router.get("/:id", authorized, locationController.getLocationById);

module.exports = router;
