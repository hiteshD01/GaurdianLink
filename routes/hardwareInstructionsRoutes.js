const express = require("express");
const router = express.Router();
const hardwareInstructionsController = require("../controllers/hardwareInstructionsController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/",
  verifyToken,
  authorizeRoles("super_admin"),
  hardwareInstructionsController.createOrReplaceHardwareInstructions
);
router.get("/", hardwareInstructionsController.getHardwareInstructions);

module.exports = router;
