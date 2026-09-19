import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Fix: "how does the boarding gate validate a QR code with zero signal?"
 *
 * Two layers, in order of preference:
 *
 * 1. MANIFEST MATCH (primary, always works offline): while the counter app
 *    still has signal (at the terminal, before departure), it calls
 *    GET /api/agency/schedules/:id/manifest-json (a JSON sibling of the PDF
 *    manifest endpoint) and caches the list of {ticketCode, seatNumber,
 *    passengerName} for that trip. At the gate, scanning a QR just checks
 *    "is this ticketCode in today's cached manifest, and not already
 *    marked boarded?" — no cryptography needed at all, fully offline.
 *
 * 2. SIGNATURE FALLBACK (for tickets sold after the manifest was cached,
 *    e.g. a late Mobile Money sale at the terminal minutes before departure):
 *    verify the HMAC signature embedded in the QR payload.
 *
 * IMPORTANT SECURITY NOTE: layer 2 requires the same QR_SIGNING_SECRET the
 * backend uses. Do NOT ship the real production secret inside the mobile
 * app bundle — it can be extracted by decompiling the APK. In production,
 * either (a) rely on layer 1 only and require gate staff to get a signal
 * bar at least once before departure to refresh the manifest, or (b) mint a
 * short-lived, per-trip, low-privilege verification key from the backend
 * (different from QR_SIGNING_SECRET) that's only ever able to verify
 * signatures, never to create bookings.
 */

const MANIFEST_CACHE_PREFIX = "manifest:";
const BOARDED_CACHE_PREFIX = "boarded:";

export async function cacheManifestOffline(scheduleId, manifestEntries) {
  await AsyncStorage.setItem(
    `${MANIFEST_CACHE_PREFIX}${scheduleId}`,
    JSON.stringify(manifestEntries)
  );
}

export async function verifyTicketOffline(scheduleId, ticketCode, seatNumber) {
  const raw = await AsyncStorage.getItem(`${MANIFEST_CACHE_PREFIX}${scheduleId}`);
  const manifest = raw ? JSON.parse(raw) : [];

  const match = manifest.find(
    (entry) => entry.ticketCode === ticketCode && entry.seatNumber === seatNumber
  );
  if (!match) {
    return { valid: false, reason: "Ticket not found in cached manifest — check signal fallback" };
  }

  const boardedKey = `${BOARDED_CACHE_PREFIX}${scheduleId}:${ticketCode}`;
  const alreadyBoarded = await AsyncStorage.getItem(boardedKey);
  if (alreadyBoarded) {
    return { valid: false, reason: "Ticket already scanned for boarding" };
  }

  await AsyncStorage.setItem(boardedKey, "1");
  return { valid: true, passenger: match };
}
