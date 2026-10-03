const crypto = require("crypto");

/**
 * Builds a human-readable tracking code like "FX-COL-4821": the first two
 * letters of the company name, a fixed "COL" (colis) segment, then a random
 * 4-digit block. Collisions are checked against the DB and retried — with
 * only 10,000 possible 4-digit blocks per tenant prefix, that matters once a
 * company has shipped more than a few hundred parcels.
 */
function buildPrefix(companyName) {
  const letters = (companyName || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 2) || "WB").padEnd(2, "X");
}

async function generateTrackingCode(Package, tenantId, companyName) {
  const prefix = buildPrefix(companyName);

  for (let attempt = 0; attempt < 20; attempt++) {
    const digits = crypto.randomInt(0, 10000).toString().padStart(4, "0");
    const candidate = `${prefix}-COL-${digits}`;
    const exists = await Package.exists({ tenantId, trackingCode: candidate });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique tracking code — try again");
}

module.exports = { generateTrackingCode };
