const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  vehicleController.createVehicle
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  vehicleController.getVehicleById
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("company", "super_admin"),
  vehicleController.getAllVehicles
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  vehicleController.updateVehicle
);

module.exports = router;
