const mongoose = require("mongoose");
const tenantScope = require("./plugins/tenantScope");

const BusSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    registrationNumber: { type: String, required: true },
    busClass: { type: String, enum: ["Classic", "VIP"], required: true },
    totalSeats: { type: Number, required: true },
    seatingLayout: { type: String, default: "3+2" }, // left+right seat pack sizes around the aisle
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BusSchema.plugin(tenantScope);

module.exports = mongoose.model("Bus", BusSchema);
