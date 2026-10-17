import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

// Local-date helpers: the report covers the user's own calendar day (Cameroon time), so the
// browser builds the start and end of the day and sends them as exact instants.
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dayStart = (s) => new Date(`${s}T00:00:00`).toISOString();
const dayEnd = (s) => new Date(`${s}T23:59:59.999`).toISOString();
const xaf = (n) => `${Math.round(n || 0).toLocaleString()} XAF`;

export default function SalesTab({ user }) {
  const { t, lang } = useLanguage();
  const isAdmin = user?.role === "agency_admin";
  const locale = lang === "fr" ? "fr-FR" : "en-GB";

  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [agentId, setAgentId] = useState("");
  const [staff, setStaff] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  async function load(fromValue = from, toValue = to, agent = agentId) {
    setError("");
    try {
      setReport(await api.salesReport(dayStart(fromValue), dayEnd(toValue), agent || undefined));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    if (isAdmin) api.listStaff().then(setStaff).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToday() {
    const d = todayStr();
    setFrom(d);
    setTo(d);
    load(d, d, agentId);
  }

  function exportCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Time", "Cashier", "Ticket", "Passenger", "Trip", "Seat", "Amount (XAF)", "Method", "Status"];
    const rows = report.sales.map((s) => [
      new Date(s.createdAt).toLocaleString(locale),
      s.soldByName || t("salesTab.unknownCashier"),
      s.ticketCode,
      s.passengerName,
      s.trip,
      s.seatNumber,
      s.farePaid,
      s.method,
      s.paymentStatus,
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${from}${to !== from ? `_${to}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totals = report?.totals;

  return (
    <>
      <div className="card">
        <h2>{t("salesTab.title")}</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          {isAdmin ? t("salesTab.subtitleAdmin") : t("salesTab.subtitleCashier")}
        </p>
        <div className="form-row" style={{ alignItems: "flex-end" }}>
          <div>
            <label className="field-label">{t("salesTab.from")}</label>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t("salesTab.to")}</label>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
          {isAdmin && (
            <div>
              <label className="field-label">{t("salesTab.cashier")}</label>
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                <option value="">{t("salesTab.allCashiers")}</option>
                {staff.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="primary" onClick={() => load()}>
            {t("salesTab.show")}
          </button>
          <button className="secondary" onClick={handleToday}>
            {t("salesTab.today")}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>

      {totals && (
        <>
          <div className="card stat-row">
            <div>
              <div className="muted">{t("salesTab.ticketsSold")}</div>
              <div className="stat-value">{totals.count}</div>
            </div>
            <div>
              <div className="muted">{t("salesTab.total")}</div>
              <div className="stat-value">{xaf(totals.amount)}</div>
            </div>
            <div>
              <div className="muted">{t("salesTab.cash")}</div>
              <div className="stat-value">{xaf(totals.cash)}</div>
            </div>
            <div>
              <div className="muted">{t("salesTab.mobileMoney")}</div>
              <div className="stat-value">{xaf(totals.mobileMoney)}</div>
            </div>
            <div>
              <div className="muted">{t("salesTab.voided")}</div>
              <div className="stat-value" style={{ color: "var(--danger)" }}>
                {totals.voidedCount} · {xaf(totals.voidedAmount)}
              </div>
            </div>
          </div>

          {isAdmin && report.byAgent.length > 0 && (
            <div className="card">
              <h2>{t("salesTab.byCashier")}</h2>
              <table>
                <thead>
                  <tr>
                    <th>{t("salesTab.colCashier")}</th>
                    <th>{t("salesTab.colCount")}</th>
                    <th>{t("salesTab.colTotal")}</th>
                    <th>{t("salesTab.colCash")}</th>
                    <th>{t("salesTab.colMobile")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byAgent.map((a) => (
                    <tr key={a.agentId || "unknown"}>
                      <td>{a.name || t("salesTab.unknownCashier")}</td>
                      <td>{a.count}</td>
                      <td>{xaf(a.amount)}</td>
                      <td>{xaf(a.cash)}</td>
                      <td>{xaf(a.mobileMoney)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{t("salesTab.salesList")}</h2>
              {report.sales.length > 0 && (
                <button className="secondary" onClick={exportCsv}>
                  {t("salesTab.exportCsv")}
                </button>
              )}
            </div>
            <table style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>{t("salesTab.colTime")}</th>
                  {isAdmin && <th>{t("salesTab.colCashier")}</th>}
                  <th>{t("salesTab.colTicket")}</th>
                  <th>{t("salesTab.colPassenger")}</th>
                  <th>{t("salesTab.colTrip")}</th>
                  <th>{t("salesTab.colSeat")}</th>
                  <th>{t("salesTab.colAmount")}</th>
                  <th>{t("salesTab.colMethod")}</th>
                  <th>{t("salesTab.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {report.sales.map((s) => (
                  <tr key={s._id}>
                    <td>{new Date(s.createdAt).toLocaleString(locale)}</td>
                    {isAdmin && <td>{s.soldByName || t("salesTab.unknownCashier")}</td>}
                    <td>{s.ticketCode}</td>
                    <td>{s.passengerName}</td>
                    <td>{s.trip}</td>
                    <td>{s.seatNumber}</td>
                    <td>{xaf(s.farePaid)}</td>
                    <td>{s.method === "Cash" ? t("salesTab.cash") : t("salesTab.mobileMoney")}</td>
                    <td>
                      <span className={`badge ${s.paymentStatus}`}>{s.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
                {report.sales.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="muted">
                      {t("salesTab.none")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
