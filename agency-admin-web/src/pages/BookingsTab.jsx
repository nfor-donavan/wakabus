import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

export default function BookingsTab() {
  const { t } = useLanguage();
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
    const refundReference = window.prompt(t("bookingsTab.refundPrompt"));
    try {
      await api.cancelBooking(bookingId, refundReference || undefined);
      loadBookings(selectedScheduleId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>{t("bookingsTab.title")}</h2>
      <div className="form-row">
        <select value={selectedScheduleId} onChange={(e) => loadBookings(e.target.value)}>
          <option value="">{t("bookingsTab.selectSchedule")}</option>
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
              <th>{t("bookingsTab.seat")}</th>
              <th>{t("bookingsTab.passenger")}</th>
              <th>{t("bookingsTab.phone")}</th>
              <th>{t("bookingsTab.ticketCode")}</th>
              <th>{t("bookingsTab.fare")}</th>
              <th>{t("bookingsTab.source")}</th>
              <th>{t("common.status")}</th>
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
                      {t("common.cancel")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  {t("bookingsTab.none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
