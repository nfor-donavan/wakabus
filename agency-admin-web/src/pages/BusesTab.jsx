import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

export default function BusesTab() {
  const { t } = useLanguage();
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState({
    registrationNumber: "",
    busClass: "Classic",
    totalSeats: 70,
    seatingLayout: "3+2",
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
      setForm({ registrationNumber: "", busClass: "Classic", totalSeats: 70, seatingLayout: "3+2" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>{t("busesTab.registerTitle")}</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder={t("busesTab.regNumberPlaceholder")}
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
              placeholder={t("busesTab.seatsPlaceholder")}
              value={form.totalSeats}
              onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
              required
            />
            <input
              placeholder={t("busesTab.layoutPlaceholder")}
              value={form.seatingLayout}
              onChange={(e) => setForm({ ...form, seatingLayout: e.target.value })}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit">
            {t("busesTab.addButton")}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>{t("busesTab.fleetTitle")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("busesTab.registration")}</th>
              <th>{t("busesTab.class")}</th>
              <th>{t("busesTab.seats")}</th>
              <th>{t("busesTab.layout")}</th>
              <th>{t("common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {buses.map((b) => (
              <tr key={b._id}>
                <td>{b.registrationNumber}</td>
                <td>{b.busClass}</td>
                <td>{b.totalSeats}</td>
                <td>{b.seatingLayout}</td>
                <td>{b.isActive ? t("busesTab.active") : t("busesTab.inactive")}</td>
              </tr>
            ))}
            {buses.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {t("busesTab.none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
