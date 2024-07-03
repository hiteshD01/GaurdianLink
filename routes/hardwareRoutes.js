const express = require("express");
const router = express.Router();
const hardwareController = require("../controllers/hardwareController");

router.post("/", hardwareController.createOrReplaceHardware);
router.get("/", hardwareController.getAllHardware);

module.exports = router;
