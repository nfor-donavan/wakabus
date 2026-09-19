const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("superadmin_token");
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),

  listTenants: () => request("/superadmin/tenants"),
  createTenant: (payload) => request("/superadmin/tenants", { method: "POST", body: payload }),
  setTenantActive: (tenantId, isActive) =>
    request(`/superadmin/tenants/${tenantId}/active`, { method: "PATCH", body: { isActive } }),
  setCommissionRate: (tenantId, commissionRate) =>
    request(`/superadmin/tenants/${tenantId}/commission`, {
      method: "PATCH",
      body: { commissionRate },
    }),

  globalRevenue: () => request("/superadmin/revenue"),
};
