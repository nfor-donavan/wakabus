const crypto = require("crypto");
const Schedule = require("../models/Schedule");
const Booking = require("../models/Booking");
const Route = require("../models/Route");
const qrTicket = require("../utils/qrTicket");

const HOLD_MINUTES = parseInt(process.env.RESERVATION_HOLD_MINUTES || "10", 10);

// Builds a { $gte, $lte } range for a "YYYY-MM-DD" date string, or returns
// null if the string isn't in that exact shape. Guards against a stray
// format (extra spaces, a different separator, a full datetime pasted in)
// turning into an invalid Date and crashing the query with a 500 — instead
// the caller gets a clear 400 telling them what went wrong.
function buildDateRange(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59`);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return undefined;
  return { $gte: start, $lte: end };
}

// GET /api/passenger/search?tenantId=&departureCity=&destinationCity=&date=
// Single-company search — used when the passenger already picked a company.
exports.searchSchedules = async (req, res) => {
  const { tenantId, departureCity, destinationCity, date } = req.query;
  if (!tenantId)
    return res.status(400).json({ message: "tenantId is required" });

  let departureTimeFilter;
  if (date) {
    departureTimeFilter = buildDateRange(date);
    if (!departureTimeFilter) {
      return res
        .status(400)
        .json({ message: "date must be in YYYY-MM-DD format" });
    }
  }

  const schedules = await Schedule.find({
    tenantId,
    status: "Scheduled",
    ...(departureTimeFilter && { departureTime: departureTimeFilter }),
  })
    .populate({
      path: "routeId",
      match: {
        ...(departureCity && { departureCity }),
        ...(destinationCity && { destinationCity }),
      },
    })
    .populate("busId");

  // populate + match can leave routeId null for non-matching docs — filter those out.
  res.json(schedules.filter((s) => s.routeId));
};

// GET /api/passenger/search-companies?departureCity=&destinationCity=&date=
// Cross-tenant search: this is what a real passenger app opens on — "Yaoundé
// to Douala tomorrow" should surface every company running that route, not
// just one. Explicitly opts out of tenant scoping since this is a public,
// intentional cross-tenant read (no sensitive data — schedules/prices are
// meant to be publicly comparable, unlike bookings or manifests).
exports.searchAcrossCompanies = async (req, res) => {
  const { departureCity, destinationCity, date } = req.query;
  if (!departureCity || !destinationCity) {
    return res
      .status(400)
      .json({ message: "departureCity and destinationCity are required" });
  }

  let departureTimeFilter;
  if (date) {
    departureTimeFilter = buildDateRange(date);
    if (!departureTimeFilter) {
      return res
        .status(400)
        .json({ message: "date must be in YYYY-MM-DD format" });
    }
  }

  const schedules = await Schedule.find({
    status: "Scheduled",
    ...(departureTimeFilter && { departureTime: departureTimeFilter }),
  })
    .setOptions({ skipTenantScope: true })
    .populate({ path: "routeId", match: { departureCity, destinationCity } })
    .populate("busId")
    .populate("tenantId", "companyName logoUrl");

  res.json(
    schedules
      .filter((s) => s.routeId)
      .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime)),
  );
};

// POST /api/passenger/reserve
// Body: { tenantId, scheduleId, seatNumber, passengerName, passengerIdCard, passengerPhone, bookingSource }
//
// Fix #1: this does NOT just $pull the seat and leave it gone forever. It
// creates a Pending Booking with a holdExpiresAt timestamp. If payment never
// completes, the reservation-expiry cron job (jobs/reservationExpiry.js)
// pushes the seat back into Schedule.availableSeats automatically.
exports.reserveSeat = async (req, res) => {
  const {
    tenantId,
    scheduleId,
    seatNumber,
    passengerName,
    passengerIdCard,
    passengerPhone,
    bookingSource,
  } = req.body;

  if (
    !tenantId ||
    !scheduleId ||
    !seatNumber ||
    !passengerName ||
    !passengerIdCard ||
    !passengerPhone
  ) {
    return res.status(400).json({ message: "Missing required booking fields" });
  }

  // Atomic seat claim — the concurrency fix from the original spec, kept as-is
  // because it's already correct.
  const schedule = await Schedule.findOneAndUpdate(
    { _id: scheduleId, tenantId, availableSeats: seatNumber },
    { $pull: { availableSeats: seatNumber } },
    { new: true },
  );
  if (!schedule) {
    return res
      .status(400)
      .json({ message: "Seat already taken or schedule not found" });
  }

  try {
    const route = await Route.findOne({ _id: schedule.routeId, tenantId });
    const farePaid = route ? route.basePrice : 0;

    const ticketCode = `TCK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    const booking = new Booking({
      tenantId,
      scheduleId,
      seatNumber,
      passengerName,
      passengerPhone,
      ticketCode,
      farePaid,
      bookingSource: bookingSource || "Mobile_App",
      paymentStatus: "Pending",
      holdExpiresAt,
    });
    booking.setPassengerIdCard(passengerIdCard);
    await booking.save();

    res.status(201).json({
      message: `Seat held for ${HOLD_MINUTES} minutes pending payment`,
      bookingId: booking._id,
      ticketCode,
      farePaid,
      holdExpiresAt,
    });
  } catch (err) {
    // Booking failed after the seat was pulled — give it back immediately
    // rather than waiting for the expiry cron.
    await Schedule.findOneAndUpdate(
      { _id: scheduleId, tenantId },
      { $addToSet: { availableSeats: seatNumber } },
    );
    res.status(500).json({ message: "Reservation failed", error: err.message });
  }
};

// GET /api/passenger/bookings/:bookingId/ticket
// Returns the signed, offline-verifiable QR payload once payment is confirmed.
exports.getTicket = async (req, res) => {
  const { bookingId } = req.params;
  const { tenantId } = req.query;
  if (!tenantId)
    return res.status(400).json({ message: "tenantId is required" });

  const booking = await Booking.findOne({ _id: bookingId, tenantId }).populate({
    path: "scheduleId",
    populate: { path: "busId routeId" },
  });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.paymentStatus !== "Paid") {
    return res
      .status(400)
      .json({
        message: `Ticket not issued — payment status is ${booking.paymentStatus}`,
      });
  }

  res.json({
    ticketCode: booking.ticketCode,
    signedQrPayload: booking.signedQrPayload,
    seatNumber: booking.seatNumber,
    passengerName: booking.passengerName,
    farePaid: booking.farePaid,
    departureTime: booking.scheduleId.departureTime,
    departureCity: booking.scheduleId.routeId?.departureCity,
    destinationCity: booking.scheduleId.routeId?.destinationCity,
    busRegistration: booking.scheduleId.busId?.registrationNumber,
  });
};

// GET /api/passenger/bookings/:bookingId/status
// Lightweight polling endpoint for the app to check whether a pending
// reservation has been confirmed yet, without pulling the full ticket payload.
exports.getBookingStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { tenantId } = req.query;
  if (!tenantId)
    return res.status(400).json({ message: "tenantId is required" });

  const booking = await Booking.findOne({ _id: bookingId, tenantId }).select(
    "paymentStatus holdExpiresAt ticketCode",
  );
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  res.json({
    paymentStatus: booking.paymentStatus,
    holdExpiresAt: booking.holdExpiresAt,
    ticketCode: booking.ticketCode,
  });
};
