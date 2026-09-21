const express = require("express");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const ctrl = require("../controllers/passengerController");
const rentalCtrl = require("../controllers/rentalController");

// Passenger-facing endpoints are public (no staff login) — a passenger
// identifies themselves by phone/booking, not a JWT session.
router.get("/search", asyncHandler(ctrl.searchSchedules));
router.get("/search-companies", asyncHandler(ctrl.searchAcrossCompanies));
router.post("/reserve", asyncHandler(ctrl.reserveSeat));
router.get("/bookings/:bookingId/ticket", asyncHandler(ctrl.getTicket));
router.get("/bookings/:bookingId/status", asyncHandler(ctrl.getBookingStatus));

// Public whole-bus rental request — no login needed, not yet wired into a
// screen in the passenger app (see rentalController.js for details).
router.post("/rentals", asyncHandler(rentalCtrl.publicCreateRentalRequest));

module.exports = router;
