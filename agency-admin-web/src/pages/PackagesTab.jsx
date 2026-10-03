import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

const STATUS_ORDER = ["Received_At_Origin", "Loaded_On_Bus", "Arrived_At_Destination", "Collected"];

const EMPTY_FORM = {
  assignedScheduleId: "",
  senderName: "",
  senderPhone: "",
  recipientName: "",
  recipientPhone: "",
  description: "",
  weightKg: "",
  priceXAF: "",
};

export default function PackagesTab() {
  const { t } = useLanguage();
  const [packages, setPackages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verifyForm, setVerifyForm] = useState({ trackingCode: "", otp: "" });
  const [verifyResult, setVerifyResult] = useState("");

  async function load() {
    try {
      const [pkgs, sched] = await Promise.all([api.listPackages(), api.listSchedules()]);
      setPackages(pkgs);
      setSchedules(sched);
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
      const pkg = await api.createPackage({
        assignedScheduleId: form.assignedScheduleId,
        sender: { name: form.senderName, phone: form.senderPhone },
        recipient: { name: form.recipientName, phone: form.recipientPhone },
        packageDetails: {
          description: form.description,
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
          priceXAF: Number(form.priceXAF),
        },
      });
      setSuccess(t("packagesTab.registeredSuccess", { code: pkg.trackingCode }));
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdvance(pkg) {
    const currentIndex = STATUS_ORDER.indexOf(pkg.status);
    const nextStatus = STATUS_ORDER[currentIndex + 1];
    if (!nextStatus || nextStatus === "Collected") return; // Collected only via verify-pickup
    try {
      await api.updatePackageStatus(pkg._id, nextStatus);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUnlock(pkg) {
    try {
      await api.unlockPackagePickup(pkg._id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setVerifyResult("");
    try {
      const result = await api.verifyPackagePickup(verifyForm.trackingCode.trim(), verifyForm.otp.trim());
      setVerifyResult(t("packagesTab.verifySuccess", { code: result.trackingCode }));
      setVerifyForm({ trackingCode: "", otp: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="card">
        <h2>{t("packagesTab.registerTitle")}</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 16 }}>
          {t("packagesTab.subtitle")}
        </p>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <select
              value={form.assignedScheduleId}
              onChange={(e) => setForm({ ...form, assignedScheduleId: e.target.value })}
              required
              style={{ flex: 2, minWidth: 260 }}
            >
              <option value="">{t("packagesTab.assignSchedule")}</option>
              {schedules.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.routeId ? `${s.routeId.departureCity} → ${s.routeId.destinationCity}` : s._id} —{" "}
                  {new Date(s.departureTime).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <input
              placeholder={t("packagesTab.senderName")}
              value={form.senderName}
              onChange={(e) => setForm({ ...form, senderName: e.target.value })}
              required
            />
            <input
              placeholder={t("packagesTab.senderPhone")}
              value={form.senderPhone}
              onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <input
              placeholder={t("packagesTab.recipientName")}
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              required
            />
            <input
              placeholder={t("packagesTab.recipientPhone")}
              value={form.recipientPhone}
              onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <input
              placeholder={t("packagesTab.description")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ flex: 2, minWidth: 240 }}
              required
            />
            <input
              placeholder={t("packagesTab.weight")}
              type="number"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            />
            <input
              placeholder={t("packagesTab.price")}
              type="number"
              value={form.priceXAF}
              onChange={(e) => setForm({ ...form, priceXAF: e.target.value })}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: "var(--success)", fontSize: 13 }}>{success}</p>}
          <button className="primary" type="submit">
            {t("packagesTab.registerButton")}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>{t("packagesTab.verifyTitle")}</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
          {t("packagesTab.verifySubtitle")}
        </p>
        <form onSubmit={handleVerify}>
          <div className="form-row">
            <input
              placeholder={t("packagesTab.trackingCode")}
              value={verifyForm.trackingCode}
              onChange={(e) => setVerifyForm({ ...verifyForm, trackingCode: e.target.value })}
              required
            />
            <input
              placeholder={t("packagesTab.otpPlaceholder")}
              value={verifyForm.otp}
              onChange={(e) => setVerifyForm({ ...verifyForm, otp: e.target.value })}
              required
            />
            <button className="primary" type="submit">
              {t("packagesTab.verifyButton")}
            </button>
          </div>
        </form>
        {verifyResult && <p style={{ color: "var(--success)", fontSize: 13 }}>{verifyResult}</p>}
      </div>

      <div className="card">
        <h2>{t("packagesTab.listTitle")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("packagesTab.trackingCode")}</th>
              <th>{t("packagesTab.sender")}</th>
              <th>{t("packagesTab.recipient")}</th>
              <th>{t("packagesTab.fee")}</th>
              <th>{t("common.status")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p._id}>
                <td>{p.trackingCode}</td>
                <td>
                  {p.sender.name}
                  <br />
                  <span className="muted">{p.sender.phone}</span>
                </td>
                <td>
                  {p.recipient.name}
                  <br />
                  <span className="muted">{p.recipient.phone}</span>
                </td>
                <td>{p.packageDetails.priceXAF?.toLocaleString()} XAF</td>
                <td>
                  <span className={`badge ${p.status === "Collected" ? "Paid" : "Pending"}`}>
                    {t(`packagesTab.status${p.status}`)}
                  </span>
                  {p.pickupLocked && (
                    <>
                      {" "}
                      <span className="badge Failed">{t("packagesTab.locked")}</span>
                    </>
                  )}
                </td>
                <td>
                  {p.status !== "Collected" && p.status !== "Arrived_At_Destination" && (
                    <button className="secondary" onClick={() => handleAdvance(p)}>
                      {t("packagesTab.advanceButton", {
                        status: t(`packagesTab.status${STATUS_ORDER[STATUS_ORDER.indexOf(p.status) + 1]}`),
                      })}
                    </button>
                  )}
                  {p.status === "Arrived_At_Destination" && !p.pickupLocked && (
                    <span className="muted">Awaiting pickup verification</span>
                  )}
                  {p.pickupLocked && (
                    <button className="secondary" onClick={() => handleUnlock(p)}>
                      {t("packagesTab.unlock")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  {t("packagesTab.none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
