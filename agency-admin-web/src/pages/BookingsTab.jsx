import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

export default function BookingsTab() {
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [claimTag, setClaimTag] = useState("");
  const [claimResult, setClaimResult] = useState("");

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

  async function handleAddLuggage(booking) {
    const description = window.prompt(t("bookingsTab.luggageDescPrompt"));
    if (!description) return;
    const feeRaw = window.prompt(t("bookingsTab.luggageFeePrompt"));
    const fee = feeRaw ? Number(feeRaw) : undefined;

    try {
      const result = await api.addLuggage(booking._id, { description, fee });
      window.alert(t("bookingsTab.luggageTagIssued", { tag: result.tagCode }));
      loadBookings(selectedScheduleId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClaim(e) {
    e.preventDefault();
    setError("");
    setClaimResult("");
    if (!claimTag.trim()) return;
    try {
      const result = await api.claimLuggage(claimTag.trim());
      setClaimResult(
        t("bookingsTab.claimSuccess", {
          desc: result.description,
          passenger: result.passengerName,
          seat: result.seatNumber,
        })
      );
      setClaimTag("");
      if (selectedScheduleId) loadBookings(selectedScheduleId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>{t("bookingsTab.claimTitle")}</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          {t("bookingsTab.claimSubtitle")}
        </p>
        <form onSubmit={handleClaim}>
          <div className="form-row">
            <input
              placeholder={t("bookingsTab.tagCodePlaceholder")}
              value={claimTag}
              onChange={(e) => setClaimTag(e.target.value)}
            />
            <button className="primary" type="submit">
              {t("bookingsTab.claimButton")}
            </button>
          </div>
        </form>
        {claimResult && <p style={{ color: "var(--success)", fontSize: 13 }}>{claimResult}</p>}
      </div>

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
                <th>{t("bookingsTab.luggage")}</th>
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
                    {b.luggage?.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        {b.luggage.map((l) => (
                          <div key={l.tagCode} style={{ fontSize: 12, marginBottom: 2 }}>
                            <span className={`badge ${l.status === "Claimed" ? "Cancelled" : "Pending"}`}>
                              {l.tagCode}
                            </span>{" "}
                            {l.description}
                          </div>
                        ))}
                      </div>
                    )}
                    {!["Cancelled", "Refunded"].includes(b.paymentStatus) && (
                      <button className="secondary" onClick={() => handleAddLuggage(b)}>
                        {t("bookingsTab.addLuggage")}
                      </button>
                    )}
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
                  <td colSpan={9} className="muted">
                    {t("bookingsTab.none")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
