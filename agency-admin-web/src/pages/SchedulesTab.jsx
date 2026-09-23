import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

export default function SchedulesTab() {
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ busId: "", routeId: "", departureTime: "", arrivalTime: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const [s, b, r] = await Promise.all([api.listSchedules(), api.listBuses(), api.listRoutes()]);
      setSchedules(s);
      setBuses(b);
      setRoutes(r);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createSchedule({
        ...form,
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
      });
      setForm({ busId: "", routeId: "", departureTime: "", arrivalTime: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(scheduleId, status) {
    try {
      await api.updateScheduleStatus(scheduleId, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDownloadManifest(scheduleId) {
    try {
      const blob = await api.downloadManifestPdf(scheduleId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manifest-${scheduleId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(schedule) {
    const label = schedule.routeId
      ? `${schedule.routeId.departureCity} → ${schedule.routeId.destinationCity}`
      : "—";
    const confirmed = window.confirm(
      t("schedulesTab.deleteConfirm", {
        route: label,
        date: new Date(schedule.departureTime).toLocaleString(),
      })
    );
    if (!confirmed) return;

    try {
      await api.deleteSchedule(schedule._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBlockSeats(schedule) {
    const raw = window.prompt(t("schedulesTab.blockSeatsPrompt"));
    if (!raw) return;

    const seatNumbers = raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (seatNumbers.length === 0) return;

    try {
      const result = await api.blockSeats(
        schedule._id,
        seatNumbers,
        "Already sold outside WakaBus (agency onboarding)"
      );
      if (result.notAvailable?.length > 0) {
        window.alert(
          `Blocked: ${result.blocked.join(", ") || "none"}.\n` +
            `Already unavailable (check these — may already be booked through WakaBus): ${result.notAvailable.join(", ")}`
        );
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUnblockAll(schedule) {
    if (!window.confirm(`${t("schedulesTab.unblockAll")}?`)) return;
    try {
      await api.unblockSeats(schedule._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>{t("schedulesTab.createTitle")}</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <select value={form.busId} onChange={(e) => setForm({ ...form, busId: e.target.value })} required>
              <option value="">{t("schedulesTab.selectBus")}</option>
              {buses.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.registrationNumber} ({b.busClass}, {b.totalSeats} seats)
                </option>
              ))}
            </select>
            <select
              value={form.routeId}
              onChange={(e) => setForm({ ...form, routeId: e.target.value })}
              required
            >
              <option value="">{t("schedulesTab.selectRoute")}</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.departureCity} → {r.destinationCity}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={form.departureTime}
              onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              value={form.arrivalTime}
              onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit">
            {t("schedulesTab.createButton")}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>{t("schedulesTab.upcoming")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("schedulesTab.route")}</th>
              <th>{t("schedulesTab.bus")}</th>
              <th>{t("schedulesTab.departure")}</th>
              <th>{t("schedulesTab.seatsLeft")}</th>
              <th>{t("schedulesTab.blockedSeats")}</th>
              <th>{t("common.status")}</th>
              <th>{t("schedulesTab.manifest")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s._id}>
                <td>
                  {s.routeId ? `${s.routeId.departureCity} → ${s.routeId.destinationCity}` : "—"}
                </td>
                <td>{s.busId ? s.busId.registrationNumber : "—"}</td>
                <td>{new Date(s.departureTime).toLocaleString()}</td>
                <td>{s.availableSeats.length}</td>
                <td>
                  {s.blockedSeats?.length > 0 ? (
                    <>
                      <span className="badge Cancelled" title={s.blockedSeats.map((b) => b.seatNumber).join(", ")}>
                        {s.blockedSeats.length}
                      </span>{" "}
                      <button className="secondary" onClick={() => handleUnblockAll(s)}>
                        {t("schedulesTab.unblockAll")}
                      </button>
                    </>
                  ) : (
                    <button className="secondary" onClick={() => handleBlockSeats(s)}>
                      {t("schedulesTab.blockSeatsButton")}
                    </button>
                  )}
                </td>
                <td>
                  <select value={s.status} onChange={(e) => handleStatusChange(s._id, e.target.value)}>
                    {["Scheduled", "Boarding", "Departed", "Cancelled"].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="secondary" onClick={() => handleDownloadManifest(s._id)}>
                    {t("schedulesTab.downloadPdf")}
                  </button>
                </td>
                <td>
                  <button className="danger" onClick={() => handleDelete(s)}>
                    {t("schedulesTab.deleteButton")}
                  </button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  {t("schedulesTab.none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
