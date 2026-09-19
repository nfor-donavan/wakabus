const express = require("express");
const router = express.Router();
const { paymentCallback } = require("../controllers/paymentController");

router.post("/callback", paymentCallback);

module.exports = router;
