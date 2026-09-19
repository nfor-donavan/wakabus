const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const tenantScope = require("./plugins/tenantScope");

const AgentSchema = new mongoose.Schema(
  {
    // tenantId is null/absent ONLY for role: 'super_admin'
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "agency_admin", "counter_agent"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AgentSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

AgentSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

// Super admins have no tenantId, so we only apply tenant scoping to lookups
// that legitimately carry one. Auth login lookups use skipTenantScope since
// email is globally unique and role is checked after fetch.
AgentSchema.plugin(tenantScope);

module.exports = mongoose.model("Agent", AgentSchema);
