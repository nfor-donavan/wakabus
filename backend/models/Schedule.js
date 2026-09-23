const mongoose = require("mongoose");
const tenantScope = require("./plugins/tenantScope");

const ScheduleSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date },
    // Seats with no pending hold and no confirmed booking.
    availableSeats: { type: [Number], required: true },
    // Seats manually removed from sale because they're already occupied
    // in an agency's other/legacy system (e.g. during onboarding, mid-trip
    // migration, or a paper-ticket sale WakaBus was never told about).
    // Never appear in availableSeats, so the passenger app and counter
    // both just see them as "taken" — this is purely the audit trail of
    // *why*, for the agency's own records.
    blockedSeats: [
      {
        seatNumber: { type: Number, required: true },
        reason: { type: String, default: "Already sold outside WakaBus" },
        blockedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["Scheduled", "Boarding", "Departed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

ScheduleSchema.plugin(tenantScope);

module.exports = mongoose.model("Schedule", ScheduleSchema);
