const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/payment-success",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  paymentController.paymentSuccess
);

router.post(
  "/buy-hardware",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  paymentController.buyHardware
);
router.get(
  "/getAllOrders",
  verifyToken,
  authorizeRoles("super_admin"),
  paymentController.getAllOrders
);
router.put(
  "/updateOrder/:id",
  verifyToken,
  authorizeRoles("super_admin"),
  paymentController.updateOrder
);

module.exports = router;
