const API_BASE = "https://wakabus-backend.onrender.com/api";
// Your live Render backend. If your Render service name is different,
// swap it in here before building.

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  // Cross-tenant search — shows every company running a given route.
  searchCompanies: (departureCity, destinationCity, date) => {
    const params = new URLSearchParams({ departureCity, destinationCity });
    if (date) params.append("date", date);
    return request(`/passenger/search-companies?${params.toString()}`);
  },

  reserveSeat: (payload) => request("/passenger/reserve", { method: "POST", body: payload }),

  getBookingStatus: (bookingId, tenantId) =>
    request(`/passenger/bookings/${bookingId}/status?tenantId=${tenantId}`),

  getTicket: (bookingId, tenantId) =>
    request(`/passenger/bookings/${bookingId}/ticket?tenantId=${tenantId}`),
};

export { API_BASE };
