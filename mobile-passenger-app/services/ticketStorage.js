import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Offline-first ticket cache.
 *
 * Fix: once a ticket is confirmed Paid, GET /api/passenger/bookings/:id/ticket
 * returns { ticketCode, signedQrPayload, seatNumber, passengerName, departureTime }.
 * We save that whole object to AsyncStorage immediately, so the boarding
 * screen renders from local storage and works with zero connectivity on
 * routes like Yaoundé–Douala where signal drops constantly.
 */
const STORAGE_KEY_PREFIX = "ticket:";

export async function saveTicketOffline(ticket) {
  const key = `${STORAGE_KEY_PREFIX}${ticket.ticketCode}`;
  await AsyncStorage.setItem(key, JSON.stringify(ticket));
}

export async function getTicketOffline(ticketCode) {
  const key = `${STORAGE_KEY_PREFIX}${ticketCode}`;
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export async function getAllOfflineTickets() {
  const keys = await AsyncStorage.getAllKeys();
  const ticketKeys = keys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX));
  const entries = await AsyncStorage.multiGet(ticketKeys);
  return entries.map(([, value]) => JSON.parse(value));
}

export async function removeTicketOffline(ticketCode) {
  const key = `${STORAGE_KEY_PREFIX}${ticketCode}`;
  await AsyncStorage.removeItem(key);
}
