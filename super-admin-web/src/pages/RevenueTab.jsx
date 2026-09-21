import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

export default function RevenueTab() {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.globalRevenue(), api.listTenants()])
      .then(([revenue, tenantList]) => {
        setRows(revenue);
        setTenants(tenantList);
      })
      .catch((err) => setError(err.message));
  }, []);

  function findTenant(tenantId) {
    return tenants.find((item) => item._id === tenantId);
  }

  const totalBookings = rows.reduce((sum, r) => sum + r.totalBookings, 0);
  const totalRevenue = rows.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
  const totalCommission = rows.reduce((sum, r) => {
    const tenant = findTenant(r._id);
    const rate = tenant ? tenant.commissionRate : 0;
    return sum + (r.totalRevenue || 0) * (rate / 100);
  }, 0);

  function formatXAF(n) {
    return `${Math.round(n).toLocaleString()} XAF`;
  }

  return (
    <>
      <div className="card" style={{ display: "flex", gap: 32 }}>
        <div>
          <div className="muted">{t("revenueTab.totalBookings")}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalBookings}</div>
        </div>
        <div>
          <div className="muted">{t("revenueTab.grossRevenue")}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatXAF(totalRevenue)}</div>
        </div>
        <div>
          <div className="muted">{t("revenueTab.commissionEarned")}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gold)" }}>
            {formatXAF(totalCommission)}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{t("revenueTab.byCompany")}</h2>
        <p className="muted">{t("revenueTab.explainer")}</p>
        {error && <p className="error-text">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>{t("revenueTab.company")}</th>
              <th>{t("revenueTab.paidBookings")}</th>
              <th>{t("revenueTab.grossRevenueCol")}</th>
              <th>{t("revenueTab.commissionRate")}</th>
              <th>{t("revenueTab.commissionEarnedCol")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tenant = findTenant(r._id);
              const rate = tenant ? tenant.commissionRate : 0;
              const commission = (r.totalRevenue || 0) * (rate / 100);
              return (
                <tr key={r._id}>
                  <td>{tenant ? tenant.companyName : r._id}</td>
                  <td>{r.totalBookings}</td>
                  <td>{formatXAF(r.totalRevenue || 0)}</td>
                  <td>{rate}%</td>
                  <td>{formatXAF(commission)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {t("revenueTab.none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
