import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

const EMPTY = { fullName: "", email: "", password: "", role: "counter_agent" };

export default function StaffTab({ user }) {
  const { t } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setStaff(await api.listStaff());
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
    setMessage("");
    try {
      const created = await api.createStaff(form);
      setMessage(t("staffTab.created", { name: created.fullName }));
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleActive(member) {
    setError("");
    setMessage("");
    if (member.isActive && !window.confirm(t("staffTab.deactivateConfirm", { name: member.fullName }))) return;
    try {
      await api.updateStaff(member._id, { isActive: !member.isActive });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResetPassword(member) {
    setError("");
    setMessage("");
    const password = window.prompt(t("staffTab.resetPrompt", { name: member.fullName }));
    if (!password) return;
    try {
      await api.updateStaff(member._id, { password });
      setMessage(t("staffTab.resetDone"));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>{t("staffTab.title")}</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          {t("staffTab.subtitle")}
        </p>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder={t("staffTab.fullName")}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder={t("staffTab.email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder={t("staffTab.password")}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="counter_agent">{t("staffTab.roleCounter")}</option>
              <option value="agency_admin">{t("staffTab.roleAdmin")}</option>
            </select>
          </div>
          {error && <p className="error-text">{error}</p>}
          {message && <p style={{ color: "var(--success)", fontSize: 13 }}>{message}</p>}
          <button className="primary" type="submit">
            {t("staffTab.addButton")}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>{t("staffTab.listTitle")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("staffTab.colName")}</th>
              <th>{t("staffTab.colEmail")}</th>
              <th>{t("staffTab.colRole")}</th>
              <th>{t("common.status")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((m) => {
              const isSelf = m._id === user?.id;
              return (
                <tr key={m._id}>
                  <td>
                    {m.fullName} {isSelf && <span className="muted">{t("staffTab.you")}</span>}
                  </td>
                  <td>{m.email}</td>
                  <td>{m.role === "agency_admin" ? t("staffTab.roleAdmin") : t("staffTab.roleCounter")}</td>
                  <td>
                    <span className={`badge ${m.isActive ? "Paid" : "Cancelled"}`}>
                      {m.isActive ? t("staffTab.active") : t("staffTab.deactivated")}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="secondary" onClick={() => handleResetPassword(m)}>
                      {t("staffTab.resetPassword")}
                    </button>{" "}
                    {!isSelf && (
                      <button className={m.isActive ? "danger" : "secondary"} onClick={() => handleToggleActive(m)}>
                        {m.isActive ? t("staffTab.deactivate") : t("staffTab.reactivate")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
