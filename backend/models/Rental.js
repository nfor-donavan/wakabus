const mongoose = require("mongoose");
const tenantScope = require("./plugins/tenantScope");

const RentalSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" }, // optional — assigned once approved

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: String,

    purpose: { type: String, required: true }, // e.g. "School excursion to Kribi"
    pickupLocation: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    passengerCount: Number,

    quotedPrice: Number, // XAF, set once the agency quotes the customer
    notes: String, // internal staff notes, never shown to the customer

    status: {
      type: String,
      enum: ["Pending", "Quoted", "Approved", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
    },

    // How the request came in — a counter agent typing in a phone/walk-in
    // request, or (future) a passenger submitting one themselves online.
    source: { type: String, enum: ["Counter", "Public"], default: "Counter" },
  },
  { timestamps: true }
);

RentalSchema.plugin(tenantScope);

module.exports = mongoose.model("Rental", RentalSchema);
