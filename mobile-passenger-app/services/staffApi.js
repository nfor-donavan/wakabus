import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./api";

const TOKEN_KEY = "wakabus_staff_token";
const USER_KEY = "wakabus_staff_user";

async function request(path, { method = "GET", body } = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const staffApi = {
  async login(email, password) {
    const data = await request("/auth/login", { method: "POST", body: { email, password } });
    if (!["agency_admin", "counter_agent"].includes(data.user.role)) {
      throw new Error("This account is not agency staff.");
    }
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  async logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  async getStoredUser() {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  getPackageByTrackingCode: (trackingCode) => request(`/agency/packages/${trackingCode}`),
  updatePackageStatus: (packageId, status) =>
    request(`/agency/packages/${packageId}/status`, { method: "PUT", body: { status } }),
  verifyPickup: (trackingCode, otp) =>
    request("/agency/packages/verify-pickup", { method: "POST", body: { trackingCode, otp } }),
};
