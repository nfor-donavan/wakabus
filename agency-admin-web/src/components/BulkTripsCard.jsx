import React, { useMemo, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Builds the exact departure instants in the browser's own time zone (Cameroon, UTC+1),
 * so the server never has to guess time zones. Times already in the past are dropped.
 */
function buildDepartures({ timesText, startDate, days, weekdays }) {
  const times = timesText.split(/[,;\s]+/).filter(Boolean);
  if (times.length === 0 || times.some((x) => !TIME_RE.test(x))) return { list: [], past: 0, badTimes: true };

  const [y, m, d] = startDate.split("-").map(Number);
  const now = Date.now();
  const list = [];
  let past = 0;

  for (let i = 0; i < days; i++) {
    const day = new Date(y, m - 1, d + i);
    if (!weekdays[day.getDay()]) continue;
    for (const tm of times) {
      const [hh, mm] = tm.split(":").map(Number);
      const dep = new Date(y, m - 1, d + i, hh, mm);
      if (dep.getTime() > now) list.push(dep.toISOString());
      else past += 1;
    }
  }
  return { list, past, badTimes: false };
}

export default function BulkTripsCard({ buses, routes, onCreated }) {
  const { t, lang } = useLanguage();
  const locale = lang === "fr" ? "fr-FR" : "en-GB";

  const [busId, setBusId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [timesText, setTimesText] = useState("06:00, 08:00");
  const [startDate, setStartDate] = useState(localToday());
  const [days, setDays] = useState(14);
  const [hours, setHours] = useState("");
  const [weekdays, setWeekdays] = useState([true, true, true, true, true, true, true]); // Sun..Sat
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const plan = useMemo(
    () => buildDepartures({ timesText, startDate, days: Math.min(Math.max(Number(days) || 1, 1), 31), weekdays }),
    [timesText, startDate, days, weekdays]
  );

  function weekdayLabel(dayIndex) {
    // 2023-01-01 was a Sunday, so day index 0 maps to Jan 1.
    return new Date(2023, 0, 1 + dayIndex).toLocaleDateString(locale, { weekday: "short" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult("");
    if (plan.badTimes) return setError(t("schedulesTab.bulkBadTimes"));
    if (plan.list.length === 0) return;
    setBusy(true);
    try {
      const res = await api.bulkCreateSchedules({
        busId,
        routeId,
        departures: plan.list,
        durationMinutes: hours ? Math.round(Number(hours) * 60) : undefined,
      });
      setResult(t("schedulesTab.bulkResult", { created: res.created, skipped: res.skipped }));
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>{t("schedulesTab.bulkTitle")}</h2>
      <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
        {t("schedulesTab.bulkSubtitle")}
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <select value={busId} onChange={(e) => setBusId(e.target.value)} required>
            <option value="">{t("schedulesTab.selectBus")}</option>
            {buses.map((b) => (
              <option key={b._id} value={b._id}>
                {b.registrationNumber} ({b.busClass})
              </option>
            ))}
          </select>
          <select value={routeId} onChange={(e) => setRouteId(e.target.value)} required>
            <option value="">{t("schedulesTab.selectRoute")}</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.departureCity} → {r.destinationCity}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <input
            placeholder={t("schedulesTab.bulkTimes")}
            value={timesText}
            onChange={(e) => setTimesText(e.target.value)}
            style={{ flex: 2, minWidth: 240 }}
            required
          />
          <div>
            <label className="field-label">{t("schedulesTab.bulkStart")}</label>
            <input type="date" value={startDate} min={localToday()} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">{t("schedulesTab.bulkDays")}</label>
            <input type="number" min="1" max="31" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t("schedulesTab.bulkDuration")}</label>
            <input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
        </div>
        <div className="weekday-row">
          {WEEK_ORDER.map((dayIndex) => (
            <label key={dayIndex} className={`chip${weekdays[dayIndex] ? " on" : ""}`}>
              <input
                type="checkbox"
                checked={weekdays[dayIndex]}
                onChange={() => setWeekdays(weekdays.map((v, i) => (i === dayIndex ? !v : v)))}
              />
              {weekdayLabel(dayIndex)}
            </label>
          ))}
        </div>

        <p className="muted" style={{ margin: "12px 0" }}>
          {plan.badTimes
            ? t("schedulesTab.bulkBadTimes")
            : `${t("schedulesTab.bulkPreview", { n: plan.list.length })}${
                plan.past > 0 ? " " + t("schedulesTab.bulkPast", { n: plan.past }) : ""
              }`}
        </p>
        {error && <p className="error-text">{error}</p>}
        {result && <p style={{ color: "var(--success)", fontSize: 13 }}>{result}</p>}
        <button className="primary" type="submit" disabled={busy || plan.list.length === 0}>
          {t("schedulesTab.bulkButton")}
        </button>
      </form>
    </div>
  );
}
