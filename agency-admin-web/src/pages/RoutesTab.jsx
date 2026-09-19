import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function RoutesTab() {
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ departureCity: "", destinationCity: "", basePrice: 5000 });
  const [error, setError] = useState("");

  async function load() {
    try {
      setRoutes(await api.listRoutes());
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
      await api.createRoute({ ...form, basePrice: Number(form.basePrice) });
      setForm({ departureCity: "", destinationCity: "", basePrice: 5000 });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Add a route</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder="Departure city (e.g. Yaoundé)"
              value={form.departureCity}
              onChange={(e) => setForm({ ...form, departureCity: e.target.value })}
              required
            />
            <input
              placeholder="Destination city (e.g. Douala)"
              value={form.destinationCity}
              onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Base price (XAF)"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit">
            Add route
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Routes</h2>
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Base price</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r._id}>
                <td>{r.departureCity}</td>
                <td>{r.destinationCity}</td>
                <td>{r.basePrice.toLocaleString()} XAF</td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  No routes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
