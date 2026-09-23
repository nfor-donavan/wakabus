const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("agency_token");
}

async function request(path, { method = "GET", body, isBlob } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (isBlob) {
    if (!res.ok) throw new Error("Request failed");
    return res.blob();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),

  listBuses: () => request("/agency/buses"),
  createBus: (payload) => request("/agency/buses", { method: "POST", body: payload }),

  listRoutes: () => request("/agency/routes"),
  createRoute: (payload) => request("/agency/routes", { method: "POST", body: payload }),

  listSchedules: () => request("/agency/schedules"),
  createSchedule: (payload) => request("/agency/schedules", { method: "POST", body: payload }),
  updateScheduleStatus: (scheduleId, status) =>
    request(`/agency/schedules/${scheduleId}/status`, { method: "PATCH", body: { status } }),
  deleteSchedule: (scheduleId) => request(`/agency/schedules/${scheduleId}`, { method: "DELETE" }),
  blockSeats: (scheduleId, seatNumbers, reason) =>
    request(`/agency/schedules/${scheduleId}/block-seats`, {
      method: "POST",
      body: { seatNumbers, reason },
    }),
  unblockSeats: (scheduleId, seatNumbers) =>
    request(`/agency/schedules/${scheduleId}/unblock-seats`, {
      method: "POST",
      body: { seatNumbers },
    }),

  cancelBooking: (bookingId, refundReference) =>
    request(`/agency/bookings/${bookingId}/cancel`, {
      method: "POST",
      body: { refundReference },
    }),
  listBookingsForSchedule: (scheduleId) => request(`/agency/schedules/${scheduleId}/bookings`),

  downloadManifestPdf: (scheduleId) =>
    request(`/agency/schedules/${scheduleId}/manifest`, { isBlob: true }),
  getManifestJson: (scheduleId) => request(`/agency/schedules/${scheduleId}/manifest-json`),

  listRentals: () => request("/agency/rentals"),
  createRental: (payload) => request("/agency/rentals", { method: "POST", body: payload }),
  updateRental: (rentalId, payload) =>
    request(`/agency/rentals/${rentalId}`, { method: "PATCH", body: payload }),
  deleteRental: (rentalId) => request(`/agency/rentals/${rentalId}`, { method: "DELETE" }),

  getToken,
};

export { API_BASE };
