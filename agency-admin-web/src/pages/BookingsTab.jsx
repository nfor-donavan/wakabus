import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function BookingsTab() {
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listSchedules().then(setSchedules).catch((err) => setError(err.message));
  }, []);

  async function loadBookings(scheduleId) {
    setSelectedScheduleId(scheduleId);
    if (!scheduleId) {
      setBookings([]);
      return;
    }
    try {
      setBookings(await api.listBookingsForSchedule(scheduleId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancel(bookingId) {
    const refundReference = window.prompt(
      "If this booking was already Paid, enter a refund reference (leave blank if unpaid):"
    );
    try {
      await api.cancelBooking(bookingId, refundReference || undefined);
      loadBookings(selectedScheduleId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Bookings by schedule</h2>
      <div className="form-row">
        <select value={selectedScheduleId} onChange={(e) => loadBookings(e.target.value)}>
          <option value="">Select a schedule…</option>
          {schedules.map((s) => (
            <option key={s._id} value={s._id}>
              {s.routeId ? `${s.routeId.departureCity} → ${s.routeId.destinationCity}` : s._id} —{" "}
              {new Date(s.departureTime).toLocaleString()}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}

      {selectedScheduleId && (
        <table>
          <thead>
            <tr>
              <th>Seat</th>
              <th>Passenger</th>
              <th>Phone</th>
              <th>Ticket code</th>
              <th>Fare</th>
              <th>Source</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.seatNumber}</td>
                <td>{b.passengerName}</td>
                <td>{b.passengerPhone}</td>
                <td>{b.ticketCode}</td>
                <td>{b.farePaid?.toLocaleString()} XAF</td>
                <td>{b.bookingSource}</td>
                <td>
                  <span className={`badge ${b.paymentStatus}`}>{b.paymentStatus}</span>
                </td>
                <td>
                  {!["Cancelled", "Refunded"].includes(b.paymentStatus) && (
                    <button className="danger" onClick={() => handleCancel(b._id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No bookings for this schedule yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
