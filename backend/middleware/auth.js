const jwt = require("jsonwebtoken");
const Agent = require("../models/Agent");

/**
 * requireAuth: verifies the JWT, then re-checks the account in the database.
 * Role and tenantId come from the database record (never from the request body),
 * and a deactivated account is refused immediately instead of staying valid until
 * its token expires — important when cashiers change often.
 * The cost is one indexed lookup by _id per request.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing auth token" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    const agent = await Agent.findOne({ _id: decoded.id }).select("isActive fullName role tenantId");
    if (!agent || !agent.isActive) {
      return res.status(401).json({ message: "This account is no longer active" });
    }
    req.user = {
      id: String(agent._id),
      role: agent.role,
      tenantId: agent.tenantId ? String(agent.tenantId) : null,
      fullName: agent.fullName,
    };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

function signToken(agent) {
  return jwt.sign(
    { id: agent._id, role: agent.role, tenantId: agent.tenantId || null },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

module.exports = { requireAuth, requireRole, signToken };
