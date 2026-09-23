const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const ctrl = require("../controllers/agencyController");
const rentalCtrl = require("../controllers/rentalController");

router.use(requireAuth, requireRole("agency_admin", "counter_agent"));

router.post("/buses", requireRole("agency_admin"), asyncHandler(ctrl.createBus));
router.get("/buses", asyncHandler(ctrl.listBuses));

router.post("/routes", requireRole("agency_admin"), asyncHandler(ctrl.createRoute));
router.get("/routes", asyncHandler(ctrl.listRoutes));

router.post("/schedules", requireRole("agency_admin"), asyncHandler(ctrl.createSchedule));
router.get("/schedules", asyncHandler(ctrl.listSchedules));
router.patch("/schedules/:scheduleId/status", asyncHandler(ctrl.updateScheduleStatus));
router.delete("/schedules/:scheduleId", requireRole("agency_admin"), asyncHandler(ctrl.deleteSchedule));
router.post("/schedules/:scheduleId/block-seats", asyncHandler(ctrl.blockSeats));
router.post("/schedules/:scheduleId/unblock-seats", asyncHandler(ctrl.unblockSeats));

router.post("/bookings/:bookingId/cancel", asyncHandler(ctrl.cancelBooking));
router.get("/schedules/:scheduleId/bookings", asyncHandler(ctrl.listBookingsForSchedule));
router.post("/bookings/:bookingId/luggage", asyncHandler(ctrl.addLuggage));
router.patch("/luggage/:tagCode/claim", asyncHandler(ctrl.claimLuggage));

router.get("/schedules/:scheduleId/manifest", asyncHandler(ctrl.getManifest));
router.get("/schedules/:scheduleId/manifest-json", asyncHandler(ctrl.getManifestJson));

router.post("/rentals", asyncHandler(rentalCtrl.createRental));
router.get("/rentals", asyncHandler(rentalCtrl.listRentals));
router.patch("/rentals/:rentalId", asyncHandler(rentalCtrl.updateRental));
router.delete("/rentals/:rentalId", requireRole("agency_admin"), asyncHandler(rentalCtrl.deleteRental));

module.exports = router;
