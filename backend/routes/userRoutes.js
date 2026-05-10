const express = require("express");
const { listUsers } = require("../controllers/userController");

const router = express.Router();

router.get("/", listUsers);

module.exports = router;
