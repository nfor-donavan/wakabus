import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function BusesTab() {
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState({
    registrationNumber: "",
    busClass: "Classic",
    totalSeats: 70,
    seatingLayout: "2x2",
  });
  const [error, setError] = useState("");

  async function load() {
    try {
      setBuses(await api.listBuses());
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
      await api.createBus({ ...form, totalSeats: Number(form.totalSeats) });
      setForm({ registrationNumber: "", busClass: "Classic", totalSeats: 70, seatingLayout: "2x2" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Register a bus</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder="Registration number (e.g. LT 123-OA)"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              required
            />
            <select
              value={form.busClass}
              onChange={(e) => setForm({ ...form, busClass: e.target.value })}
            >
              <option value="Classic">Classic</option>
              <option value="VIP">VIP</option>
            </select>
            <input
              type="number"
              placeholder="Total seats"
              value={form.totalSeats}
              onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
              required
            />
            <input
              placeholder="Seating layout"
              value={form.seatingLayout}
              onChange={(e) => setForm({ ...form, seatingLayout: e.target.value })}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit">
            Add bus
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Fleet</h2>
        <table>
          <thead>
            <tr>
              <th>Registration</th>
              <th>Class</th>
              <th>Seats</th>
              <th>Layout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {buses.map((b) => (
              <tr key={b._id}>
                <td>{b.registrationNumber}</td>
                <td>{b.busClass}</td>
                <td>{b.totalSeats}</td>
                <td>{b.seatingLayout}</td>
                <td>{b.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
            {buses.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No buses registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
