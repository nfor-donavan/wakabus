const mongoose = require("mongoose");
const tenantScope = require("./plugins/tenantScope");

const RouteSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    departureCity: { type: String, required: true },
    destinationCity: { type: String, required: true },
    basePrice: { type: Number, required: true }, // XAF
  },
  { timestamps: true }
);

RouteSchema.plugin(tenantScope);

module.exports = mongoose.model("Route", RouteSchema);
