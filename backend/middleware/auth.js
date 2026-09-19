const jwt = require("jsonwebtoken");

/**
 * requireAuth: verifies the JWT and attaches req.user = { id, role, tenantId }.
 * tenantId comes from the TOKEN, never from the request body/params — this is
 * the core of the "tenantId isolation must be enforced in middleware" fix.
 * An agency_admin or counter_agent literally cannot query another tenant's
 * data because their JWT only carries their own tenantId, and every
 * controller below scopes every query with req.user.tenantId, and the
 * tenantScope Mongoose plugin throws if that's ever forgotten.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing auth token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, tenantId }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
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
