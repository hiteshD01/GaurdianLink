const express = require("express");
const router = express.Router();
const termsAndConditionsController = require("../controllers/termsAndConditionsController");

router.post("/", termsAndConditionsController.createOrReplaceTermsAndConditions);
router.get("/", termsAndConditionsController.getTermsAndConditions);

module.exports = router;
