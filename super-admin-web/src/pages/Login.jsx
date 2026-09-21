import React, { useState } from "react";
import { api } from "../api.js";
import { useLanguage } from "../i18n.jsx";

function FeatureIcon() {
  return (
    <span className="auth-feature-icon">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8.5L6.2 11.5L13 4.5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Login({ onLoggedIn }) {
  const { t, toggleLang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const features = [t("login.feature1"), t("login.feature2"), t("login.feature3")];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      if (data.user.role !== "super_admin") {
        throw new Error(t("login.notSuperAdmin"));
      }
      localStorage.setItem("superadmin_token", data.token);
      localStorage.setItem("superadmin_user", JSON.stringify(data.user));
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-top">
          <img src="/app-icon.png" alt="WakaBus" />
          <span>WakaBus</span>
        </div>

        <div className="auth-brand-mid">
          <h2>{t("login.brandHeadline")}</h2>
          <p>{t("login.brandBody")}</p>
          <ul className="auth-features">
            {features.map((f) => (
              <li key={f}>
                <FeatureIcon />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-brand-bottom">
          © {new Date().getFullYear()} WakaBus — {t("login.footer")}
        </div>
      </div>

      <div className="auth-form-panel">
        <form className="auth-form-card" onSubmit={handleSubmit}>
          <button
            type="button"
            className="icon-toggle"
            style={{ marginBottom: 16 }}
            onClick={toggleLang}
          >
            {t("common.langToggle")}
          </button>

          <h1>{t("login.title")}</h1>
          <p className="auth-subtitle">{t("login.subtitle")}</p>

          {error && (
            <div className="auth-alert">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="field-group">
            <label htmlFor="email">{t("common.email")}</label>
            <input
              id="email"
              type="email"
              placeholder="you@wakabus.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">{t("common.password")}</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? t("common.hide") : t("common.show")}
              </button>
            </div>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? t("common.signingIn") : t("common.signIn")}
          </button>

          <p className="auth-footer-note">{t("login.footerNote")}</p>
        </form>
      </div>
    </div>
  );
}
