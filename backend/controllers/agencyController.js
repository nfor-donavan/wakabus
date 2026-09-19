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
