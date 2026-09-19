const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const ctrl = require("../controllers/agencyController");

router.use(requireAuth, requireRole("agency_admin", "counter_agent"));

router.post("/buses", requireRole("agency_admin"), asyncHandler(ctrl.createBus));
router.get("/buses", asyncHandler(ctrl.listBuses));

router.post("/routes", requireRole("agency_admin"), asyncHandler(ctrl.createRoute));
router.get("/routes", asyncHandler(ctrl.listRoutes));

router.post("/schedules", requireRole("agency_admin"), asyncHandler(ctrl.createSchedule));
router.get("/schedules", asyncHandler(ctrl.listSchedules));
router.patch("/schedules/:scheduleId/status", asyncHandler(ctrl.updateScheduleStatus));

router.post("/bookings/:bookingId/cancel", asyncHandler(ctrl.cancelBooking));
router.get("/schedules/:scheduleId/bookings", asyncHandler(ctrl.listBookingsForSchedule));

router.get("/schedules/:scheduleId/manifest", asyncHandler(ctrl.getManifest));
router.get("/schedules/:scheduleId/manifest-json", asyncHandler(ctrl.getManifestJson));

module.exports = router;
