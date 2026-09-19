import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function SchedulesTab() {
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

  return (
    <>
      <div className="card">
        <h2>Create a schedule</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <select value={form.busId} onChange={(e) => setForm({ ...form, busId: e.target.value })} required>
              <option value="">Select bus</option>
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
              <option value="">Select route</option>
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
            Create schedule
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Upcoming schedules</h2>
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Bus</th>
              <th>Departure</th>
              <th>Seats left</th>
              <th>Status</th>
              <th>Manifest</th>
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
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No schedules yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
