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
