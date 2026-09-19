const mongoose = require("mongoose");
const tenantScope = require("./plugins/tenantScope");
const { encrypt, decrypt } = require("../utils/crypto");

const BookingSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
    seatNumber: { type: Number, required: true },
    passengerName: { type: String, required: true },
    // Stored encrypted (AES-256-GCM) — never the raw national ID number.
    passengerIdCardEncrypted: { type: String, required: true },
    passengerPhone: { type: String, required: true },
    ticketCode: { type: String, unique: true, required: true },
    signedQrPayload: { type: String }, // what gets rendered as the QR code

    // The fare actually charged for this seat, copied from Route.basePrice
    // at the moment of reservation. Stored on the booking (not re-derived
    // later) so historical revenue stays correct even if the route's price
    // changes afterward.
    farePaid: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Expired", "Cancelled", "Refunded"],
      default: "Pending",
    },
    paymentReference: String,
    bookingSource: { type: String, enum: ["Counter", "Mobile_App"], default: "Mobile_App" },

    // Fix: seat-hold with expiry, so an abandoned Mobile Money attempt
    // doesn't permanently vanish a seat from inventory.
    holdExpiresAt: { type: Date, required: true },

    // Fix: cancellation/refund path
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
    refundReference: String,
  },
  { timestamps: true }
);

// Never let a raw ID number in memory become the stored value by accident.
BookingSchema.methods.setPassengerIdCard = function (rawIdNumber) {
  this.passengerIdCardEncrypted = encrypt(rawIdNumber);
};

// Only for authorized, auditable use (checkpoint manifest generation).
BookingSchema.methods.getDecryptedIdCard = function () {
  return decrypt(this.passengerIdCardEncrypted);
};

// Auto-expire index as a safety net in addition to the cron sweep in jobs/.
BookingSchema.index({ holdExpiresAt: 1, paymentStatus: 1 });

BookingSchema.plugin(tenantScope);

module.exports = mongoose.model("Booking", BookingSchema);
