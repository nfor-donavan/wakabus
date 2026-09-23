const Bus = require("../models/Bus");
const Route = require("../models/Route");
const Schedule = require("../models/Schedule");
const Booking = require("../models/Booking");
const { buildManifestPdf } = require("../utils/manifestPdf");

// Every query below uses req.user.tenantId, taken from the verified JWT —
// never from req.body/req.params — so an agency can only ever touch its own data.

exports.createBus = async (req, res) => {
  const { registrationNumber, busClass, totalSeats, seatingLayout } = req.body;
  const bus = await Bus.create({
    tenantId: req.user.tenantId,
    registrationNumber,
    busClass,
    totalSeats,
    seatingLayout,
  });
  res.status(201).json(bus);
};

exports.listBuses = async (req, res) => {
  const buses = await Bus.find({ tenantId: req.user.tenantId });
  res.json(buses);
};

exports.createRoute = async (req, res) => {
  const { departureCity, destinationCity, basePrice } = req.body;
  const route = await Route.create({
    tenantId: req.user.tenantId,
    departureCity,
    destinationCity,
    basePrice,
  });
  res.status(201).json(route);
};

exports.listRoutes = async (req, res) => {
  const routes = await Route.find({ tenantId: req.user.tenantId });
  res.json(routes);
};

exports.createSchedule = async (req, res) => {
  const { busId, routeId, departureTime, arrivalTime } = req.body;

  const bus = await Bus.findOne({ _id: busId, tenantId: req.user.tenantId });
  if (!bus) return res.status(404).json({ message: "Bus not found for this tenant" });

  const seatNumbers = Array.from({ length: bus.totalSeats }, (_, i) => i + 1);

  const schedule = await Schedule.create({
    tenantId: req.user.tenantId,
    busId,
    routeId,
    departureTime,
    arrivalTime,
    availableSeats: seatNumbers,
  });
  res.status(201).json(schedule);
};

exports.listSchedules = async (req, res) => {
  const schedules = await Schedule.find({ tenantId: req.user.tenantId }).populate("busId routeId");
  res.json(schedules);
};

exports.updateScheduleStatus = async (req, res) => {
  const { scheduleId } = req.params;
  const { status } = req.body;
  const schedule = await Schedule.findOneAndUpdate(
    { _id: scheduleId, tenantId: req.user.tenantId },
    { status },
    { new: true }
  );
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });
  res.json(schedule);
};

// DELETE /api/agency/schedules/:scheduleId
// For cleaning up mistakes — a schedule created twice, a typo'd departure
// time, etc. Deliberately refuses to delete a schedule that has any active
// (Pending or Paid) booking on it, so this can't be used to quietly make a
// paying passenger's seat disappear — cancel those bookings first. Any
// already-Cancelled/Expired/Failed booking records for the schedule are
// cleaned up alongside it, since they carry no live seat or revenue.
exports.deleteSchedule = async (req, res) => {
  const { scheduleId } = req.params;

  const schedule = await Schedule.findOne({ _id: scheduleId, tenantId: req.user.tenantId });
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });

  const activeBookingCount = await Booking.countDocuments({
    tenantId: req.user.tenantId,
    scheduleId,
    paymentStatus: { $in: ["Pending", "Paid"] },
  });

  if (activeBookingCount > 0) {
    return res.status(400).json({
      message: `Cannot delete — ${activeBookingCount} active booking(s) exist on this schedule. Cancel them first.`,
    });
  }

  await Booking.deleteMany({ tenantId: req.user.tenantId, scheduleId });
  await Schedule.deleteOne({ _id: scheduleId, tenantId: req.user.tenantId });

  res.json({ message: "Schedule deleted" });
};

// POST /api/agency/schedules/:scheduleId/block-seats
// The tool for the Moghamo problem: an agency going live on WakaBus mid-way
// through selling a trip on another system (paper, a different app, etc.)
// needs to tell WakaBus "these seats are already gone" without having a
// digitized passenger record for each one. This removes them from sale the
// same way a real booking would — the passenger app and counter both just
// see them as taken — while keeping a lightweight audit trail of why.
// Any seat number that's already unavailable (already booked *through*
// WakaBus, not just blocked) is reported back separately, since that case
// is a genuine conflict worth the agency's attention, not routine cleanup.
exports.blockSeats = async (req, res) => {
  const { scheduleId } = req.params;
  const { seatNumbers, reason } = req.body;

  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return res.status(400).json({ message: "seatNumbers must be a non-empty array" });
  }
  const numbers = [...new Set(seatNumbers.map(Number).filter((n) => Number.isInteger(n) && n > 0))];

  const schedule = await Schedule.findOne({ _id: scheduleId, tenantId: req.user.tenantId });
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });

  const stillAvailable = numbers.filter((n) => schedule.availableSeats.includes(n));
  const notAvailable = numbers.filter((n) => !schedule.availableSeats.includes(n));

  if (stillAvailable.length > 0) {
    await Schedule.findOneAndUpdate(
      { _id: scheduleId, tenantId: req.user.tenantId },
      {
        $pull: { availableSeats: { $in: stillAvailable } },
        $push: {
          blockedSeats: {
            $each: stillAvailable.map((seatNumber) => ({
              seatNumber,
              reason: reason || "Already sold outside WakaBus",
            })),
          },
        },
      }
    );
  }

  res.json({
    blocked: stillAvailable,
    // Already unavailable for some other reason — either already blocked,
    // or already booked through WakaBus itself. Surfaced so the agency can
    // check which case it is rather than assuming it worked silently.
    notAvailable,
  });
};

// POST /api/agency/schedules/:scheduleId/unblock-seats
// Body: { seatNumbers: [12, 15] } — omit seatNumbers to unblock everything
// blocked on this schedule (e.g. once the agency confirms their migration
// list was wrong, or a "sold elsewhere" seat turned out to be free).
exports.unblockSeats = async (req, res) => {
  const { scheduleId } = req.params;
  const { seatNumbers } = req.body;

  const schedule = await Schedule.findOne({ _id: scheduleId, tenantId: req.user.tenantId });
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });

  const toUnblock =
    Array.isArray(seatNumbers) && seatNumbers.length > 0
      ? [...new Set(seatNumbers.map(Number))]
      : schedule.blockedSeats.map((b) => b.seatNumber);

  await Schedule.findOneAndUpdate(
    { _id: scheduleId, tenantId: req.user.tenantId },
    {
      $pull: { blockedSeats: { seatNumber: { $in: toUnblock } } },
      $addToSet: { availableSeats: { $each: toUnblock } },
    }
  );

  res.json({ unblocked: toUnblock });
};

// Counter-agent cancellation with a refund reference recorded for reconciliation.
// GET /api/agency/schedules/:scheduleId/bookings
exports.listBookingsForSchedule = async (req, res) => {
  const { scheduleId } = req.params;
  const bookings = await Booking.find({
    tenantId: req.user.tenantId,
    scheduleId,
  }).sort({ seatNumber: 1 });
  res.json(bookings);
};

exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const { refundReference } = req.body;

  const booking = await Booking.findOne({ _id: bookingId, tenantId: req.user.tenantId });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (["Cancelled", "Refunded"].includes(booking.paymentStatus)) {
    return res.status(400).json({ message: "Booking already cancelled" });
  }

  const wasPaid = booking.paymentStatus === "Paid";
  booking.paymentStatus = wasPaid && refundReference ? "Refunded" : "Cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user.id;
  if (refundReference) booking.refundReference = refundReference;
  await booking.save();

  // Release the seat back to inventory.
  await Schedule.findOneAndUpdate(
    { _id: booking.scheduleId, tenantId: req.user.tenantId },
    { $addToSet: { availableSeats: booking.seatNumber } }
  );

  res.json({ message: "Booking cancelled", booking });
};

// GET /api/tenants/:tenantId/schedules/:scheduleId/manifest
exports.getManifest = async (req, res) => {
  const { scheduleId } = req.params;

  const schedule = await Schedule.findOne({
    _id: scheduleId,
    tenantId: req.user.tenantId,
  }).populate("busId routeId");
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });

  const bookings = await Booking.find({
    tenantId: req.user.tenantId,
    scheduleId,
    paymentStatus: { $in: ["Paid"] },
  }).sort({ seatNumber: 1 });

  // Decrypt ID numbers only here, at the point of a legally-required,
  // authenticated, auditable manifest print — never in any general API response.
  const passengers = bookings.map((b) => ({
    seatNumber: b.seatNumber,
    passengerName: b.passengerName,
    passengerPhone: b.passengerPhone,
    passengerIdCard: b.getDecryptedIdCard(),
    ticketCode: b.ticketCode,
    bookingSource: b.bookingSource,
  }));

  const pdfBuffer = await buildManifestPdf({ schedule, passengers });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=manifest-${schedule._id}.pdf`
  );
  res.send(pdfBuffer);
};

// GET /api/agency/schedules/:scheduleId/manifest-json
// Lightweight JSON sibling of the PDF manifest, for the counter app to
// pre-download and cache before departure so the gate agent's app can
// validate tickets offline (see mobile-passenger-app/services/qrVerifyOffline.js).
// Deliberately excludes the national ID number — the gate only needs
// ticketCode + seatNumber + name to validate boarding.
exports.getManifestJson = async (req, res) => {
  const { scheduleId } = req.params;

  const schedule = await Schedule.findOne({ _id: scheduleId, tenantId: req.user.tenantId });
  if (!schedule) return res.status(404).json({ message: "Schedule not found" });

  const bookings = await Booking.find({
    tenantId: req.user.tenantId,
    scheduleId,
    paymentStatus: "Paid",
  })
    .select("ticketCode seatNumber passengerName")
    .sort({ seatNumber: 1 });

  res.json({ scheduleId, entries: bookings });
};
