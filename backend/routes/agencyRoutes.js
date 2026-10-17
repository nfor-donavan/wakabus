const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const ctrl = require("../controllers/agencyController");
const rentalCtrl = require("../controllers/rentalController");
const packageCtrl = require("../controllers/packageController");
const staffCtrl = require("../controllers/staffController");
const reportCtrl = require("../controllers/reportController");

router.use(requireAuth, requireRole("agency_admin", "counter_agent"));

router.post("/buses", requireRole("agency_admin"), asyncHandler(ctrl.createBus));
router.get("/buses", asyncHandler(ctrl.listBuses));

router.post("/routes", requireRole("agency_admin"), asyncHandler(ctrl.createRoute));
router.get("/routes", asyncHandler(ctrl.listRoutes));

router.post("/schedules/bulk", requireRole("agency_admin"), asyncHandler(ctrl.bulkCreateSchedules));
router.post("/schedules", requireRole("agency_admin"), asyncHandler(ctrl.createSchedule));
router.get("/schedules", asyncHandler(ctrl.listSchedules));
router.patch("/schedules/:scheduleId/status", asyncHandler(ctrl.updateScheduleStatus));
router.delete("/schedules/:scheduleId", requireRole("agency_admin"), asyncHandler(ctrl.deleteSchedule));
router.post("/schedules/:scheduleId/block-seats", asyncHandler(ctrl.blockSeats));
router.post("/schedules/:scheduleId/unblock-seats", asyncHandler(ctrl.unblockSeats));

router.post("/counter-sales", asyncHandler(ctrl.createCounterSale));
router.get("/reports/sales", asyncHandler(reportCtrl.salesReport));

// Staff accounts — admin only. Deactivating an account locks it out immediately.
router.get("/staff", requireRole("agency_admin"), asyncHandler(staffCtrl.listStaff));
router.post("/staff", requireRole("agency_admin"), asyncHandler(staffCtrl.createStaff));
router.patch("/staff/:staffId", requireRole("agency_admin"), asyncHandler(staffCtrl.updateStaff));
router.get("/bookings/:bookingId/ticket-pdf", asyncHandler(ctrl.getTicketPdf));
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

// Packages / waybill (courier) — same terminals, same buses, separate cargo.
router.post("/packages", asyncHandler(packageCtrl.createPackage));
router.get("/packages", asyncHandler(packageCtrl.listPackages));
router.get("/packages/:trackingCode", asyncHandler(packageCtrl.getPackageByTrackingCode));
router.put("/packages/:packageId/status", asyncHandler(packageCtrl.updatePackageStatus));
router.post("/packages/verify-pickup", asyncHandler(packageCtrl.verifyPickup));
router.patch(
  "/packages/:packageId/unlock",
  requireRole("agency_admin"),
  asyncHandler(packageCtrl.unlockPickup)
);
router.get("/schedules/:scheduleId/packages", asyncHandler(packageCtrl.listPackagesForSchedule));

module.exports = router;
