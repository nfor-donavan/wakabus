const express = require("express");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const ctrl = require("../controllers/passengerController");

// Passenger-facing endpoints are public (no staff login) — a passenger
// identifies themselves by phone/booking, not a JWT session.
router.get("/search", asyncHandler(ctrl.searchSchedules));
router.get("/search-companies", asyncHandler(ctrl.searchAcrossCompanies));
router.post("/reserve", asyncHandler(ctrl.reserveSeat));
router.get("/bookings/:bookingId/ticket", asyncHandler(ctrl.getTicket));
router.get("/bookings/:bookingId/status", asyncHandler(ctrl.getBookingStatus));

module.exports = router;
