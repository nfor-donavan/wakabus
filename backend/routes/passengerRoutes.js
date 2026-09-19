const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/passengerController");

// Passenger-facing endpoints are public (no staff login) — a passenger
// identifies themselves by phone/booking, not a JWT session.
router.get("/search", ctrl.searchSchedules);
router.get("/search-companies", ctrl.searchAcrossCompanies);
router.post("/reserve", ctrl.reserveSeat);
router.get("/bookings/:bookingId/ticket", ctrl.getTicket);
router.get("/bookings/:bookingId/status", ctrl.getBookingStatus);

module.exports = router;
