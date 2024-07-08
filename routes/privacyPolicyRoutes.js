const express = require("express");
const router = express.Router();
const privacyPolicyController = require("../controllers/privacyPolicyController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/",
  verifyToken,
  authorizeRoles("super_admin"),
  privacyPolicyController.createOrReplacePrivacyPolicy
);
router.get(
  "/",
  authorizeRoles("driver", "company", "super_admin"),
  privacyPolicyController.getPrivacyPolicy
);

module.exports = router;
