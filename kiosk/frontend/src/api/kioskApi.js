import axios from "axios";

const client = axios.create({
  baseURL: "/api/kiosk",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

export const kioskApi = {
  // ------------------------------------------------------------
  // 1. Self-Service Employee Operations
  // ------------------------------------------------------------
  scanSelfService: (data) => client.post("/self-service/scan", data),
  getNextDayServices: (params) => client.get("/self-service/services", { params }),
  getNextDayMenu: (params) => client.get("/self-service/menu", { params }),
  bookNextDay: (data) => client.post("/self-service/book", data),
  cancelBooking: (data) => client.post("/self-service/cancel", data),

  // ------------------------------------------------------------
  // 2. Staff Serving Counter Operations (/counter/*)
  // ------------------------------------------------------------
  counterLogin: (data) => client.post("/counter/login", data),
  counterResolve: (identifier, params) =>
    client.get(`/counter/resolve/${encodeURIComponent(identifier)}`, { params }),
  counterServe: (data, token) =>
    client.post("/counter/serve", data, {
      headers: token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {},
    }),
  counterCancel: (data, token) =>
    client.post("/counter/cancel", data, {
      headers: token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {},
    }),

  // On-Spot Surplus Food (Walk-In)
  counterWalkinCustomer: (params, token) =>
    client.get("/counter/walkin/customer", {
      params,
      headers: token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {},
    }),
  counterWalkinMenu: (params, token) =>
    client.get("/counter/walkin/menu", {
      params,
      headers: token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {},
    }),
  counterWalkinServe: (data, token) =>
    client.post("/counter/walkin/serve", data, {
      headers: token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {},
    }),

  // Canteen Facility Discovery
  counterGetCanteens: () => client.get("/counter/canteens"),
  counterGetTodaySlots: (params) => client.get("/counter/today-slots", { params }),

  // ------------------------------------------------------------
  // 3. Diagnostics & Heartbeat
  // ------------------------------------------------------------
  getHealth: () => client.get("/system/health"),
};
