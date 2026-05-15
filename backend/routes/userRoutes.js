const express = require("express");
const { listUsers, getSettings, updateSettings } = require("../controllers/userController");

const router = express.Router();

router.get("/", listUsers);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

module.exports = router;
