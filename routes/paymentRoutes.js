const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/buy-hardware",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  paymentController.buyHardware
);

router.post("/notify", paymentController.paymentNotification);

module.exports = router;
