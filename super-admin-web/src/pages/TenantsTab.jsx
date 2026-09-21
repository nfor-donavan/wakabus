import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

export default function TenantsTab() {
  const { t } = useLanguage();
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
      setSuccess(t("tenantsTab.successMessage", { company: form.companyName, email: form.adminEmail }));
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
        <h2>{t("tenantsTab.onboardTitle")}</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder={t("tenantsTab.companyName")}
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
            <input
              placeholder={t("tenantsTab.contactPhone")}
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
          <div className="form-row">
            <input
              placeholder={t("tenantsTab.adminName")}
              value={form.adminFullName}
              onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder={t("tenantsTab.adminEmail")}
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder={t("tenantsTab.tempPassword")}
              value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: "var(--success)", fontSize: 13 }}>{success}</p>}
          <button className="primary" type="submit">
            {t("tenantsTab.createButton")}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>{t("tenantsTab.listTitle")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("tenantsTab.company")}</th>
              <th>{t("tenantsTab.contact")}</th>
              <th>{t("tenantsTab.commission")}</th>
              <th>{t("common.status")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant._id}>
                <td>{tenant.companyName}</td>
                <td>{tenant.contactPhone || "—"}</td>
                <td>
                  <input
                    type="number"
                    defaultValue={tenant.commissionRate}
                    style={{ width: 70, minWidth: 0 }}
                    onBlur={(e) => handleCommissionChange(tenant, e.target.value)}
                  />
                </td>
                <td>{tenant.isActive ? t("tenantsTab.active") : t("tenantsTab.suspended")}</td>
                <td>
                  <button
                    className={tenant.isActive ? "danger" : "secondary"}
                    onClick={() => handleToggleActive(tenant)}
                  >
                    {tenant.isActive ? t("tenantsTab.suspend") : t("tenantsTab.reactivate")}
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {t("tenantsTab.none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
