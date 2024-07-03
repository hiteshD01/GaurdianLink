const express = require("express");
const router = express.Router();
const hardwareController = require("../controllers/hardwareController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/",
  verifyToken,
  authorizeRoles("super_admin"),
  hardwareController.createOrReplaceHardware
);
router.get(
  "/",
  verifyToken,
  authorizeRoles("driver", "company", "super_admin"),
  hardwareController.getAllHardware
);

module.exports = router;
