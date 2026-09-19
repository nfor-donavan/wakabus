const crypto = require("crypto");

const ALGO = "aes-256-gcm";

function getKey() {
  const secret = process.env.QR_SIGNING_SECRET || "fallback_dev_secret_change_me";
  // Derive a stable 32-byte key from whatever secret string is configured.
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string (e.g. a national ID number) for storage.
 * Returns "iv:authTag:ciphertext", all hex-encoded.
 */
function encrypt(plainText) {
  if (plainText === undefined || plainText === null) return plainText;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

/**
 * Decrypts a string produced by encrypt(). Only call this from code paths
 * that are legally/operationally allowed to see the raw ID number
 * (e.g. checkpoint manifest generation), never for general API responses.
 */
function decrypt(stored) {
  if (!stored || typeof stored !== "string" || stored.split(":").length !== 3) return stored;
  const [ivHex, tagHex, dataHex] = stored.split(":");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const plain = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return plain.toString("utf8");
}

module.exports = { encrypt, decrypt };
