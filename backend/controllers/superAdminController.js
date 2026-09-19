const Tenant = require("../models/Tenant");
const Agent = require("../models/Agent");
const Booking = require("../models/Booking");

// Register a new bus company (tenant) and its first agency_admin user.
exports.createTenant = async (req, res) => {
  try {
    const { companyName, contactPhone, logoUrl, adminFullName, adminEmail, adminPassword } =
      req.body;

    const tenant = await Tenant.create({ companyName, contactPhone, logoUrl });

    const passwordHash = await Agent.hashPassword(adminPassword);
    const admin = await Agent.create({
      tenantId: tenant._id,
      fullName: adminFullName,
      email: adminEmail,
      passwordHash,
      role: "agency_admin",
    });

    res.status(201).json({ tenant, admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: "Failed to create tenant", error: err.message });
  }
};

exports.listTenants = async (req, res) => {
  // Legitimate cross-tenant read — explicitly opted in, Super-Admin-only route.
  const tenants = await Tenant.find({}).setOptions({ skipTenantScope: true });
  res.json(tenants);
};

exports.setTenantActive = async (req, res) => {
  const { tenantId } = req.params;
  const { isActive } = req.body;
  const tenant = await Tenant.findByIdAndUpdate(tenantId, { isActive }, { new: true }).setOptions(
    { skipTenantScope: true }
  );
  res.json(tenant);
};

exports.setCommissionRate = async (req, res) => {
  const { tenantId } = req.params;
  const { commissionRate } = req.body;
  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    { commissionRate },
    { new: true }
  ).setOptions({ skipTenantScope: true });
  res.json(tenant);
};

// Platform-wide revenue snapshot across every tenant — now a real XAF total,
// not just a booking count, using the farePaid stored on each booking.
exports.globalRevenue = async (req, res) => {
  const rows = await Booking.aggregate([
    { $match: { paymentStatus: "Paid" } },
    {
      $group: {
        _id: "$tenantId",
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$farePaid" },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
  res.json(rows);
};
