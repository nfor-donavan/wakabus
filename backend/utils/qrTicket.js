const crypto = require("crypto");

/**
 * Fixes: "how does a boarding gate agent validate a ticket with zero signal?"
 *
 * We don't just print a random ticketCode into the QR. We sign a compact
 * payload with HMAC-SHA256 using a server-only secret. The passenger app
 * caches the signed payload string offline (AsyncStorage). The driver/
 * gate-agent app also has an offline copy of the PUBLIC verification logic
 * (same HMAC secret, distributed at build time via secure config, OR the
 * gate app can verify online when it has signal and fall back to trusting
 * a valid-looking signature + local "already scanned" cache when it doesn't).
 *
 * Payload fields kept intentionally minimal to keep the QR small and fast
 * to scan: ticketCode, scheduleId, seatNumber, an expiry (departure + buffer).
 */
function getSecret() {
  return process.env.QR_SIGNING_SECRET || "fallback_dev_secret_change_me";
}

function sign(payloadObj) {
  const payload = JSON.stringify(payloadObj);
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
  // What actually gets embedded in the QR code
  return `${payloadB64}.${signature}`;
}

function verify(qrString) {
  try {
    const [payloadB64, signature] = qrString.split(".");
    if (!payloadB64 || !signature) return { valid: false, reason: "Malformed QR" };

    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(payloadB64)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: "Signature mismatch — possible forged ticket" };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return { valid: false, reason: "Ticket expired", payload };
    }
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: "Could not parse QR payload" };
  }
}

module.exports = { sign, verify };
