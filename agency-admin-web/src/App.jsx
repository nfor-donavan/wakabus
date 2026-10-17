import React, { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import BusesTab from "./pages/BusesTab.jsx";
import RoutesTab from "./pages/RoutesTab.jsx";
import SchedulesTab from "./pages/SchedulesTab.jsx";
import BookingsTab from "./pages/BookingsTab.jsx";
import RentalsTab from "./pages/RentalsTab.jsx";
import PackagesTab from "./pages/PackagesTab.jsx";
import CounterTab from "./pages/CounterTab.jsx";
import StaffTab from "./pages/StaffTab.jsx";
import SalesTab from "./pages/SalesTab.jsx";
import { useLanguage } from "./i18n.jsx";
import BrandLoader from "./components/BrandLoader.jsx";
import BrandFooter from "./components/BrandFooter.jsx";
import { BRAND } from "./branding.js";

// Cashiers (counter_agent) only see what they use at the desk; fleet, routes and staff
// accounts are for the agency admin. The server enforces this too — hiding is just tidiness.
const ADMIN_ONLY = ["buses", "routes", "staff"];

function useTabs(t, role) {
  const all = [
    { id: "counter", label: t("nav.counter"), component: CounterTab },
    { id: "schedules", label: t("nav.schedules"), component: SchedulesTab },
    { id: "bookings", label: t("nav.bookings"), component: BookingsTab },
    { id: "packages", label: t("nav.packages"), component: PackagesTab },
    { id: "rentals", label: t("nav.rentals"), component: RentalsTab },
    { id: "sales", label: t("nav.sales"), component: SalesTab },
    { id: "buses", label: t("nav.fleet"), component: BusesTab },
    { id: "routes", label: t("nav.routes"), component: RoutesTab },
    { id: "staff", label: t("nav.staff"), component: StaffTab },
  ];
  return role === "agency_admin" ? all : all.filter((tab) => !ADMIN_ONLY.includes(tab.id));
}

const defaultTabFor = (role) => (role === "counter_agent" ? "counter" : "schedules");

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
  const { t, lang, toggleLang } = useLanguage();
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("agency_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [activeTab, setActiveTab] = useState(() => {
    const raw = localStorage.getItem("agency_user");
    return defaultTabFor(raw ? JSON.parse(raw).role : null);
  });
  const [theme, setTheme] = useState(() => localStorage.getItem("wakabus_theme") || "light");

  // One short branded start-up screen per browser session (not on every reload
  // of an already-open tab, and never for ordinary API calls).
  const [booting, setBooting] = useState(() => !sessionStorage.getItem("wakabus_booted"));

  useEffect(() => {
    if (!booting) return undefined;
    const id = setTimeout(() => {
      sessionStorage.setItem("wakabus_booted", "1");
      setBooting(false);
    }, 900);
    return () => clearTimeout(id);
  }, [booting]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wakabus_theme", theme);
  }, [theme]);

  function handleLogout() {
    localStorage.removeItem("agency_token");
    localStorage.removeItem("agency_user");
    setUser(null);
  }

  if (booting) {
    return <BrandLoader text={t("brand.initializing")} />;
  }

  if (!user) {
    return (
      <Login
        onLoggedIn={(u) => {
          setUser(u);
          setActiveTab(defaultTabFor(u.role));
        }}
      />
    );
  }

  const TABS = useTabs(t, user.role);
  const current = TABS.find((tb) => tb.id === activeTab) || TABS[0];
  const ActiveComponent = current.component;

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
            className={`nav-item ${current.id === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </aside>
      <main className="main">
        <div className="topbar">
          <div className="topbar-title">
            <img className="topbar-emblem" src={BRAND.emblem} alt={BRAND.company} />
            <h1>{current.label}</h1>
          </div>
          <div className="topbar-actions">
            <span className="muted">
              {user.fullName} · {user.role.replace("_", " ")}
            </span>
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
        <div className="main-content">
          <ActiveComponent user={user} />
        </div>
        <BrandFooter />
      </main>
    </div>
  );
}
