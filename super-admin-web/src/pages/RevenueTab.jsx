import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function RevenueTab() {
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

  function tenant(tenantId) {
    return tenants.find((t) => t._id === tenantId);
  }

  const totalBookings = rows.reduce((sum, r) => sum + r.totalBookings, 0);
  const totalRevenue = rows.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
  const totalCommission = rows.reduce((sum, r) => {
    const t = tenant(r._id);
    const rate = t ? t.commissionRate : 0;
    return sum + (r.totalRevenue || 0) * (rate / 100);
  }, 0);

  function formatXAF(n) {
    return `${Math.round(n).toLocaleString()} XAF`;
  }

  return (
    <>
      <div className="card" style={{ display: "flex", gap: 32 }}>
        <div>
          <div className="muted">Total paid bookings</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalBookings}</div>
        </div>
        <div>
          <div className="muted">Gross ticket revenue</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatXAF(totalRevenue)}</div>
        </div>
        <div>
          <div className="muted">Platform commission earned</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gold)" }}>
            {formatXAF(totalCommission)}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Revenue by company</h2>
        <p className="muted">
          Gross revenue is the sum of fares on Paid bookings. Commission is calculated at each
          company's current commission rate — it's an estimate for past bookings if the rate has
          changed since they were made.
        </p>
        {error && <p className="error-text">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Paid bookings</th>
              <th>Gross revenue</th>
              <th>Commission rate</th>
              <th>Commission earned</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const t = tenant(r._id);
              const rate = t ? t.commissionRate : 0;
              const commission = (r.totalRevenue || 0) * (rate / 100);
              return (
                <tr key={r._id}>
                  <td>{t ? t.companyName : r._id}</td>
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
                  No paid bookings recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
