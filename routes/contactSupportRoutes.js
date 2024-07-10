const express = require("express");
const router = express.Router();
const contactSupport = require("../controllers/contactSupportController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/",
  verifyToken,
  authorizeRoles("super_admin"),
  contactSupport.createOrReplaceContactSupport
);
router.get("/", contactSupport.getPrivacyPolicy);

module.exports = router;
