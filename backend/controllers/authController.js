const Agent = require("../models/Agent");
const { signToken } = require("../middleware/auth");

// Login is the one legitimate place we look up an Agent without a tenantId
// filter, since the person hasn't told us their tenant yet — email is what
// identifies them. We mark it explicitly so it's an intentional exception,
// not an accident.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const agent = await Agent.findOne({ email: email.toLowerCase() }).setOptions({
      skipTenantScope: true,
    });

    if (!agent || !agent.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await agent.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(agent);
    res.json({
      token,
      user: {
        id: agent._id,
        fullName: agent.fullName,
        role: agent.role,
        tenantId: agent.tenantId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};
