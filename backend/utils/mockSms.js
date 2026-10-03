/**
 * No SMS gateway is configured yet (same situation as the Mobile Money
 * webhook elsewhere in this codebase). This logs the message clearly so the
 * trigger points are visible and testable now, and is a one-function swap
 * once a real provider (e.g. Twilio, Africa's Talking, Nexmo) is wired in.
 */
function sendMockSms(phone, message) {
  console.log(`[MOCK SMS] -> ${phone}: ${message}`);
  // TODO: replace with a real SMS gateway call, e.g.:
  // await smsClient.send({ to: phone, body: message });
  return { sent: true, mock: true, phone, message };
}

module.exports = { sendMockSms };
