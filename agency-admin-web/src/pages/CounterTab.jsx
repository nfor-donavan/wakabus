import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";
import { buildSeatRows } from "../utils/seatLayout.js";

const EMPTY_FORM = {
  passengerName: "",
  passengerIdCard: "",
  passengerPhone: "",
  paymentMethod: "Cash",
  paymentReference: "",
};

export default function CounterTab() {
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState([]);
  const [scheduleId, setScheduleId] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState("");
  const [sale, setSale] = useState(null); // last completed sale, shown with a Print button

  async function loadSchedules() {
    try {
      const all = await api.listSchedules();
      setSchedules(all.filter((s) => ["Scheduled", "Boarding"].includes(s.status)));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  const schedule = schedules.find((s) => s._id === scheduleId);
  const bus = schedule?.busId;

  const layout = useMemo(
    () => (bus ? buildSeatRows(bus.totalSeats, bus.seatingLayout, bus.busClass) : null),
    [bus]
  );
  const available = useMemo(() => new Set(schedule?.availableSeats || []), [schedule]);
  const blocked = useMemo(() => new Set((schedule?.blockedSeats || []).map((b) => b.seatNumber)), [schedule]);
  const fare = schedule?.routeId?.basePrice;

  function handleScheduleChange(id) {
    setScheduleId(id);
    setSelectedSeat(null);
    setSale(null);
    setError("");
  }

  function renderSeat(seat) {
    const isFree = available.has(seat);
    const className = ["seat", selectedSeat === seat && "selected", blocked.has(seat) && "blocked"]
      .filter(Boolean)
      .join(" ");
    return (
      <button key={seat} type="button" className={className} disabled={!isFree} onClick={() => setSelectedSeat(seat)}>
        {seat}
      </button>
    );
  }

  async function handleSell(e) {
    e.preventDefault();
    if (!selectedSeat) return;
    setSelling(true);
    setError("");
    try {
      const result = await api.createCounterSale({
        scheduleId,
        seatNumber: selectedSeat,
        ...form,
        paymentReference: form.paymentMethod === "Mobile_Money" ? form.paymentReference : undefined,
      });
      setSale(result);
      setSelectedSeat(null);
      setForm(EMPTY_FORM);
      await loadSchedules(); // refresh so the sold seat greys out
    } catch (err) {
      setError(err.message);
      await loadSchedules(); // the seat may have just been taken elsewhere — show the real state
      setSelectedSeat(null);
    } finally {
      setSelling(false);
    }
  }

  async function handlePrint() {
    try {
      const blob = await api.downloadTicketPdf(sale.bookingId);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        // Pop-up blocked — fall back to a normal download.
        const a = document.createElement("a");
        a.href = url;
        a.download = `ticket-${sale.ticketCode}.pdf`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>{t("counterTab.title")}</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          {t("counterTab.subtitle")}
        </p>
        <div className="form-row">
          <select value={scheduleId} onChange={(e) => handleScheduleChange(e.target.value)} style={{ flex: 2, minWidth: 260 }}>
            <option value="">{t("counterTab.selectTrip")}</option>
            {schedules.map((s) => (
              <option key={s._id} value={s._id}>
                {s.routeId ? `${s.routeId.departureCity} → ${s.routeId.destinationCity}` : s._id} —{" "}
                {new Date(s.departureTime).toLocaleString()} ({s.availableSeats.length})
              </option>
            ))}
          </select>
        </div>
        {schedules.length === 0 && <p className="muted">{t("counterTab.noTrips")}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      {schedule && layout && (
        <div className="card">
          {sale && (
            <div className="sale-success">
              <strong>{t("counterTab.soldTitle")}</strong>
              <div>
                {t("counterTab.soldDetail", {
                  seat: sale.seatNumber,
                  code: sale.ticketCode,
                  fare: sale.farePaid.toLocaleString(),
                })}
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button className="primary" type="button" onClick={handlePrint}>
                  {t("counterTab.printTicket")}
                </button>
                <button className="secondary" type="button" onClick={() => setSale(null)}>
                  {t("counterTab.sellAnother")}
                </button>
              </div>
            </div>
          )}

          <div className="counter-layout">
            <div>
              <h2>{t("counterTab.pickSeat")}</h2>
              <div className="seat-legend">
                <span><i /> {t("counterTab.legendFree")}</span>
                <span><i style={{ background: "var(--border)", borderColor: "var(--border)" }} /> {t("counterTab.legendTaken")}</span>
                <span><i style={{ background: "var(--navy)" }} /> {t("counterTab.legendSelected")}</span>
              </div>
              <div className="seatmap">
                <div className="seat-cab">
                  <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="2.4" />
                      <path d="M12 3v6.6M5.3 16l4.5-2.6M18.7 16l-4.5-2.6" />
                    </svg>
                    1 · {t("counterTab.driver")}
                  </div>
                  <div>
                    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="2" width="16" height="20" rx="2" />
                      <circle cx="13" cy="12" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                    {t("counterTab.door")}
                  </div>
                </div>
                {layout.rows.map((row, i) => (
                  <div key={i}>
                    {i === 0 && <div className="seat-besidedriver">{t("counterTab.besideDriver")}</div>}
                    <div className="seat-row">
                      <div className="seat-pack">{row.left.map(renderSeat)}</div>
                      <div className="seat-aisle" />
                      <div className="seat-pack">{row.right.map(renderSeat)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form className="counter-form" onSubmit={handleSell}>
              <h2>{t("counterTab.fare")}</h2>
              <div className="counter-fare">{fare != null ? `${fare.toLocaleString()} XAF` : "—"}</div>
              <input
                placeholder={t("counterTab.passengerName")}
                value={form.passengerName}
                onChange={(e) => setForm({ ...form, passengerName: e.target.value })}
                required
              />
              <input
                placeholder={t("counterTab.idCard")}
                value={form.passengerIdCard}
                onChange={(e) => setForm({ ...form, passengerIdCard: e.target.value })}
                required
              />
              <input
                placeholder={t("counterTab.phone")}
                value={form.passengerPhone}
                onChange={(e) => setForm({ ...form, passengerPhone: e.target.value })}
                required
              />
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="Cash">{t("counterTab.cash")}</option>
                <option value="Mobile_Money">{t("counterTab.mobileMoney")}</option>
              </select>
              {form.paymentMethod === "Mobile_Money" && (
                <input
                  placeholder={t("counterTab.reference")}
                  value={form.paymentReference}
                  onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                />
              )}
              <button className="primary" type="submit" disabled={!selectedSeat || selling} style={{ width: "100%" }}>
                {selling
                  ? t("counterTab.selling")
                  : selectedSeat
                  ? t("counterTab.sellButton", { seat: selectedSeat })
                  : t("counterTab.selectSeatFirst")}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
