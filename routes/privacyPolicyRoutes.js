const express = require("express");
const router = express.Router();
const privacyPolicyController = require("../controllers/privacyPolicyController");

router.post("/", privacyPolicyController.createOrReplacePrivacyPolicy);
router.get("/", privacyPolicyController.getPrivacyPolicy);

module.exports = router;
