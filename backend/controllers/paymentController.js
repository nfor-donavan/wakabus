const crypto = require("crypto");
const Booking = require("../models/Booking");
const Schedule = require("../models/Schedule");
const qrTicket = require("../utils/qrTicket");

// Validates the payment gateway's signature so random POSTs can't mark
// bookings as paid. Adjust the header name / signing scheme to match
// whichever gateway you integrate (Campay, Smobilpay, etc.) — this is the
// generic HMAC pattern most of them use.
function isValidWebhookSignature(req) {
  const signature = req.headers["x-webhook-signature"];
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// POST /api/payments/callback
// Body (gateway-specific, normalized here): { bookingId, status, paymentReference }
exports.paymentCallback = async (req, res) => {
  if (!isValidWebhookSignature(req)) {
    return res.status(401).json({ message: "Invalid webhook signature" });
  }

  const { bookingId, status, paymentReference } = req.body;

  const booking = await Booking.findOne({ _id: bookingId }).setOptions({ skipTenantScope: true });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  // Ignore late callbacks for a hold that already expired and was released.
  if (booking.paymentStatus === "Expired" || booking.paymentStatus === "Cancelled") {
    return res.status(409).json({ message: `Booking already ${booking.paymentStatus.toLowerCase()}` });
  }

  if (status !== "SUCCESS") {
    booking.paymentStatus = "Failed";
    booking.paymentReference = paymentReference;
    await booking.save();

    // Release the seat back immediately on a known failure — no need to
    // wait for the expiry sweep.
    await Schedule.findOneAndUpdate(
      { _id: booking.scheduleId },
      { $addToSet: { availableSeats: booking.seatNumber } }
    ).setOptions({ skipTenantScope: true });

    return res.json({ message: "Payment recorded as failed" });
  }

  const schedule = await Schedule.findOne({ _id: booking.scheduleId }).setOptions({
    skipTenantScope: true,
  });

  booking.paymentStatus = "Paid";
  booking.paymentReference = paymentReference;
  booking.signedQrPayload = qrTicket.sign({
    ticketCode: booking.ticketCode,
    scheduleId: String(booking.scheduleId),
    seatNumber: booking.seatNumber,
    // Valid until a few hours after departure, so a delayed boarding still scans.
    expiresAt: new Date(schedule.departureTime).getTime() + 6 * 60 * 60 * 1000,
  });
  await booking.save();

  // TODO: trigger confirmation SMS here via your SMS gateway.

  res.json({ message: "Payment confirmed, ticket issued", ticketCode: booking.ticketCode });
};
