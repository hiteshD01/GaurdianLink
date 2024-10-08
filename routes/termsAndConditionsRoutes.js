const express = require("express");
const router = express.Router();
const termsAndConditionsController = require("../controllers/termsAndConditionsController");
const verifyToken = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRoles");

router.post(
  "/",
  verifyToken,
  authorizeRoles("super_admin"),
  termsAndConditionsController.createOrReplaceTermsAndConditions
);
router.get("/", termsAndConditionsController.getTermsAndConditions);

module.exports = router;
