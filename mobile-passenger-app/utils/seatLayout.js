/**
 * Real inter-city buses aren't laid out like a plane (a uniform grid) — one
 * side of the aisle carries a 3-seat pack, the other a 2-seat pack (VIP
 * coaches are often 2+2 for extra legroom). This turns a flat seat count
 * into rows shaped like an actual bus, with the driver's cab at the front.
 *
 * seatingLayout on the Bus model is a free-typed string like "3+2" or
 * "3x2" — left pack size first, right pack size second. Old data saved as
 * "2x2" before this convention still parses fine. Anything unparseable
 * falls back to a sensible default by bus class.
 */
export function parseSeatSides(seatingLayout, busClass) {
  if (seatingLayout) {
    const match = String(seatingLayout).match(/^(\d+)\s*[x+]\s*(\d+)$/i);
    if (match) {
      return { left: parseInt(match[1], 10), right: parseInt(match[2], 10) };
    }
  }
  // Default: a 3-seat pack on the left of the aisle, 2 on the right for a
  // standard Classic coach; VIP coaches usually run 2+2 for extra legroom.
  return busClass === "VIP" ? { left: 2, right: 2 } : { left: 3, right: 2 };
}

/**
 * Splits seat numbers 1..totalSeats into front-to-back rows, filling the
 * left pack first then the right pack in each row (matches how the backend
 * assigns seat numbers sequentially when a schedule is created).
 * Returns { rows: [{ left: [seatNumbers], right: [seatNumbers] }], left, right }.
 * rows[0] is the front row — the one beside the driver's cab.
 */
export function buildSeatRows(totalSeats, seatingLayout, busClass) {
  const { left, right } = parseSeatSides(seatingLayout, busClass);
  const rows = [];
  let seatNumber = 1;

  while (seatNumber <= totalSeats) {
    const leftSeats = [];
    for (let i = 0; i < left && seatNumber <= totalSeats; i++) leftSeats.push(seatNumber++);

    const rightSeats = [];
    for (let i = 0; i < right && seatNumber <= totalSeats; i++) rightSeats.push(seatNumber++);

    if (leftSeats.length === 0 && rightSeats.length === 0) break; // safety net
    rows.push({ left: leftSeats, right: rightSeats });
  }

  return { rows, left, right };
}
