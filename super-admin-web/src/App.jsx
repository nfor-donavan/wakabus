import React, { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import TenantsTab from "./pages/TenantsTab.jsx";
import RevenueTab from "./pages/RevenueTab.jsx";
import { useLanguage } from "./i18n.jsx";

function useTabs(t) {
  return [
    { id: "tenants", label: t("nav.tenants"), component: TenantsTab },
    { id: "revenue", label: t("nav.revenue"), component: RevenueTab },
  ];
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function App() {
  const { t, toggleLang } = useLanguage();
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("superadmin_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [activeTab, setActiveTab] = useState("tenants");
  const [theme, setTheme] = useState(() => localStorage.getItem("wakabus_theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wakabus_theme", theme);
  }, [theme]);

  function handleLogout() {
    localStorage.removeItem("superadmin_token");
    localStorage.removeItem("superadmin_user");
    setUser(null);
  }

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  const TABS = useTabs(t);
  const ActiveComponent = TABS.find((tb) => tb.id === activeTab)?.component || TenantsTab;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/app-icon.png" alt="WakaBus" />
          <span>WakaBus</span>
        </div>
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </aside>
      <main className="main">
        <div className="topbar">
          <h1>{TABS.find((tb) => tb.id === activeTab)?.label}</h1>
          <div className="topbar-actions">
            <span className="muted">{user.fullName}</span>
            <button
              className="icon-toggle"
              onClick={() => setTheme((th) => (th === "light" ? "dark" : "light"))}
              title={theme === "light" ? t("common.darkMode") : t("common.lightMode")}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
            <button className="icon-toggle" onClick={toggleLang} title="Switch language">
              {t("common.langToggle")}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              {t("common.logout")}
            </button>
          </div>
        </div>
        <ActiveComponent />
      </main>
    </div>
  );
}
