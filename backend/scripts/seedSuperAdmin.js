/**
 * One-time setup script — creates the first Super Admin account.
 * There's no public signup route for this role by design (a bus-booking
 * platform should not let anyone self-register as the platform owner).
 *
 * Usage:
 *   cd backend
 *   node scripts/seedSuperAdmin.js "Your Name" you@example.com "a-strong-password"
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Agent = require("../models/Agent");

async function main() {
  const [, , fullName, email, password] = process.argv;
  if (!fullName || !email || !password) {
    console.error('Usage: node scripts/seedSuperAdmin.js "Full Name" email password');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Agent.findOne({ email: email.toLowerCase() }).setOptions({
    skipTenantScope: true,
  });
  if (existing) {
    console.error(`An account with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = await Agent.hashPassword(password);
  const admin = await Agent.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role: "super_admin",
  });

  console.log(`Super Admin created: ${admin.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
