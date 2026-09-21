import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

const STATUS_OPTIONS = ["Pending", "Quoted", "Approved", "Rejected", "Completed", "Cancelled"];

const EMPTY_FORM = {
  customerName: "",
  customerPhone: "",
  purpose: "",
  pickupLocation: "",
  destination: "",
  startDate: "",
  endDate: "",
  passengerCount: "",
  notes: "",
};

export default function RentalsTab() {
  const { t } = useLanguage();
  const [rentals, setRentals] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  async function load() {
    try {
      setRentals(await api.listRentals());
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
      await api.createRental({
        ...form,
        passengerCount: form.passengerCount ? Number(form.passengerCount) : undefined,
      });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(rentalId, status) {
    try {
      await api.updateRental(rentalId, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetPrice(rental) {
    const value = window.prompt(t("rentalsTab.setPrice") + " (XAF)", rental.quotedPrice || "");
    if (value === null) return;
    const quotedPrice = Number(value);
    if (Number.isNaN(quotedPrice)) return;
    try {
      await api.updateRental(rental._id, { quotedPrice, status: rental.status === "Pending" ? "Quoted" : rental.status });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(rental) {
    if (!window.confirm(`${t("common.delete")} — ${rental.customerName}?`)) return;
    try {
      await api.deleteRental(rental._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function statusLabel(status) {
    return t(`rentalsTab.status${status}`);
  }

  return (
    <>
      <div className="card">
        <h2>{t("rentalsTab.logTitle")}</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 16 }}>
          {t("rentalsTab.subtitle")}
        </p>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder={t("rentalsTab.customerName")}
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              required
            />
            <input
              placeholder={t("rentalsTab.customerPhone")}
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              required
            />
            <input
              placeholder={t("rentalsTab.passengerCount")}
              type="number"
              value={form.passengerCount}
              onChange={(e) => setForm({ ...form, passengerCount: e.target.value })}
            />
          </div>
          <div className="form-row">
            <input
              placeholder={t("rentalsTab.purpose")}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              style={{ flex: 2, minWidth: 240 }}
              required
            />
          </div>
          <div className="form-row">
            <input
              placeholder={t("rentalsTab.pickup")}
              value={form.pickupLocation}
              onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
              required
            />
            <input
              placeholder={t("rentalsTab.destination")}
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                {t("rentalsTab.startDate")}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                {t("rentalsTab.endDate")}
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <input
              placeholder={t("rentalsTab.notes")}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ flex: 2, minWidth: 240 }}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit">
            {t("rentalsTab.submitButton")}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>{t("rentalsTab.listTitle")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("rentalsTab.customer")}</th>
              <th>{t("rentalsTab.destination")}</th>
              <th>{t("rentalsTab.dates")}</th>
              <th>{t("rentalsTab.quotedPrice")}</th>
              <th>{t("common.status")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((r) => (
              <tr key={r._id}>
                <td>
                  {r.customerName}
                  <br />
                  <span className="muted">{r.customerPhone}</span>
                </td>
                <td>
                  {r.pickupLocation} → {r.destination}
                  <br />
                  <span className="muted">{r.purpose}</span>
                </td>
                <td>
                  {new Date(r.startDate).toLocaleDateString()} –{" "}
                  {new Date(r.endDate).toLocaleDateString()}
                </td>
                <td>
                  <button className="secondary" onClick={() => handleSetPrice(r)}>
                    {r.quotedPrice ? `${r.quotedPrice.toLocaleString()} XAF` : t("rentalsTab.setPrice")}
                  </button>
                </td>
                <td>
                  <select value={r.status} onChange={(e) => handleStatusChange(r._id, e.target.value)}>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {statusLabel(opt)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="danger" onClick={() => handleDelete(r)}>
                    {t("common.delete")}
                  </button>
                </td>
              </tr>
            ))}
            {rentals.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  {t("rentalsTab.none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
