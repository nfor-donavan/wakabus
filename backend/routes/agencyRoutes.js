const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const ctrl = require("../controllers/agencyController");

router.use(requireAuth, requireRole("agency_admin", "counter_agent"));

router.post("/buses", requireRole("agency_admin"), ctrl.createBus);
router.get("/buses", ctrl.listBuses);

router.post("/routes", requireRole("agency_admin"), ctrl.createRoute);
router.get("/routes", ctrl.listRoutes);

router.post("/schedules", requireRole("agency_admin"), ctrl.createSchedule);
router.get("/schedules", ctrl.listSchedules);
router.patch("/schedules/:scheduleId/status", ctrl.updateScheduleStatus);

router.post("/bookings/:bookingId/cancel", ctrl.cancelBooking);
router.get("/schedules/:scheduleId/bookings", ctrl.listBookingsForSchedule);

router.get("/schedules/:scheduleId/manifest", ctrl.getManifest);
router.get("/schedules/:scheduleId/manifest-json", ctrl.getManifestJson);

module.exports = router;
