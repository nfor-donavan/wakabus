import React, { useState } from "react";
import Login from "./pages/Login.jsx";
import BusesTab from "./pages/BusesTab.jsx";
import RoutesTab from "./pages/RoutesTab.jsx";
import SchedulesTab from "./pages/SchedulesTab.jsx";
import BookingsTab from "./pages/BookingsTab.jsx";

const TABS = [
  { id: "schedules", label: "Schedules", component: SchedulesTab },
  { id: "bookings", label: "Bookings", component: BookingsTab },
  { id: "buses", label: "Fleet", component: BusesTab },
  { id: "routes", label: "Routes", component: RoutesTab },
];

export default function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("agency_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [activeTab, setActiveTab] = useState("schedules");

  function handleLogout() {
    localStorage.removeItem("agency_token");
    localStorage.removeItem("agency_user");
    setUser(null);
  }

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || SchedulesTab;

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
          <h1>{TABS.find((t) => t.id === activeTab)?.label}</h1>
          <div>
            <span className="muted" style={{ marginRight: 12 }}>
              {user.fullName} · {user.role.replace("_", " ")}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
        <ActiveComponent />
      </main>
    </div>
  );
}
