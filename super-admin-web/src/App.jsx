import React, { useState } from "react";
import Login from "./pages/Login.jsx";
import TenantsTab from "./pages/TenantsTab.jsx";
import RevenueTab from "./pages/RevenueTab.jsx";

const TABS = [
  { id: "tenants", label: "Transport Companies", component: TenantsTab },
  { id: "revenue", label: "Revenue", component: RevenueTab },
];

export default function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("superadmin_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [activeTab, setActiveTab] = useState("tenants");

  function handleLogout() {
    localStorage.removeItem("superadmin_token");
    localStorage.removeItem("superadmin_user");
    setUser(null);
  }

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || TenantsTab;

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
              {user.fullName}
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
