import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function TenantsTab() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({
    companyName: "",
    contactPhone: "",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      setTenants(await api.listTenants());
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
    setSuccess("");
    try {
      await api.createTenant(form);
      setSuccess(`${form.companyName} onboarded — admin login sent to ${form.adminEmail}.`);
      setForm({ companyName: "", contactPhone: "", adminFullName: "", adminEmail: "", adminPassword: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleActive(tenant) {
    try {
      await api.setTenantActive(tenant._id, !tenant.isActive);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCommissionChange(tenant, value) {
    try {
      await api.setCommissionRate(tenant._id, Number(value));
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>Onboard a new transport company</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder="Company name (e.g. Finexs Voyage)"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
            <input
              placeholder="Contact phone"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
          <div className="form-row">
            <input
              placeholder="Agency admin full name"
              value={form.adminFullName}
              onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Agency admin email"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Temporary password"
              value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: "var(--success)", fontSize: 13 }}>{success}</p>}
          <button className="primary" type="submit">
            Create tenant
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Transport companies</h2>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Commission %</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t._id}>
                <td>{t.companyName}</td>
                <td>{t.contactPhone || "—"}</td>
                <td>
                  <input
                    type="number"
                    defaultValue={t.commissionRate}
                    style={{ width: 70, minWidth: 0 }}
                    onBlur={(e) => handleCommissionChange(t, e.target.value)}
                  />
                </td>
                <td>{t.isActive ? "Active" : "Suspended"}</td>
                <td>
                  <button
                    className={t.isActive ? "danger" : "secondary"}
                    onClick={() => handleToggleActive(t)}
                  >
                    {t.isActive ? "Suspend" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No transport companies onboarded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
