const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    logoUrl: String,
    isActive: { type: Boolean, default: true },
    contactPhone: String,
    commissionRate: { type: Number, default: 8 }, // % platform commission
  },
  { timestamps: true }
);

// No tenantScope plugin here — Tenant IS the tenant boundary, managed only by Super Admin.
module.exports = mongoose.model("Tenant", TenantSchema);
