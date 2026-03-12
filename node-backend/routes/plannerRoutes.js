const express = require("express");
const router = express.Router();
const controller = require("../controllers/plannerController");

router.get("/", controller.home);
router.post("/route", controller.route);

module.exports = router;
