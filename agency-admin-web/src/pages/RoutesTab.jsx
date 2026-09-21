import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

export default function RoutesTab() {
  const { t } = useLanguage();
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
        <h2>{t("routesTab.addTitle")}</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder={t("routesTab.departurePlaceholder")}
              value={form.departureCity}
              onChange={(e) => setForm({ ...form, departureCity: e.target.value })}
              required
            />
            <input
              placeholder={t("routesTab.destinationPlaceholder")}
              value={form.destinationCity}
              onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder={t("routesTab.pricePlaceholder")}
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit">
            {t("routesTab.addButton")}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>{t("routesTab.listTitle")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("routesTab.from")}</th>
              <th>{t("routesTab.to")}</th>
              <th>{t("routesTab.basePrice")}</th>
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
                  {t("routesTab.none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
