const express = require("express");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const { paymentCallback } = require("../controllers/paymentController");

router.post("/callback", asyncHandler(paymentCallback));

module.exports = router;
