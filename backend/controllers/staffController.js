const Agent = require("../models/Agent");

// All staff endpoints are agency_admin only (enforced in the routes) and always
// scoped to the admin's own company via the verified req.user.tenantId.

// GET /api/agency/staff
exports.listStaff = async (req, res) => {
  const staff = await Agent.find({ tenantId: req.user.tenantId })
    .select("fullName email role isActive createdAt")
    .sort({ createdAt: 1 });
  res.json(staff);
};

// POST /api/agency/staff  { fullName, email, password, role }
exports.createStaff = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email and password are required" });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }
  const safeRole = role === "agency_admin" ? "agency_admin" : "counter_agent";

  try {
    const agent = await Agent.create({
      tenantId: req.user.tenantId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await Agent.hashPassword(password),
      role: safeRole,
    });
    res.status(201).json({
      _id: agent._id,
      fullName: agent.fullName,
      email: agent.email,
      role: agent.role,
      isActive: agent.isActive,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    throw err;
  }
};

// PATCH /api/agency/staff/:staffId  { isActive?, password?, fullName? }
exports.updateStaff = async (req, res) => {
  const { staffId } = req.params;
  const { isActive, password, fullName } = req.body;

  const agent = await Agent.findOne({ _id: staffId, tenantId: req.user.tenantId });
  if (!agent) return res.status(404).json({ message: "Staff member not found" });

  if (isActive === false && String(agent._id) === req.user.id) {
    return res.status(400).json({ message: "You can't deactivate your own account" });
  }
  if (isActive !== undefined) agent.isActive = Boolean(isActive);
  if (fullName) agent.fullName = fullName.trim();
  if (password !== undefined) {
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    agent.passwordHash = await Agent.hashPassword(password);
  }
  await agent.save();

  res.json({ _id: agent._id, fullName: agent.fullName, email: agent.email, role: agent.role, isActive: agent.isActive });
};
