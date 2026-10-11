import axios from "axios";

const client = axios.create({
  baseURL: "/api/kiosk",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

export const kioskApi = {
  // Self-Service Employee Operations
  scanSelfService: (data) => client.post("/self-service/scan", data),
  getNextDayServices: (params) => client.get("/self-service/services", { params }),
  getNextDayMenu: (params) => client.get("/self-service/menu", { params }),
  bookNextDay: (data) => client.post("/self-service/book", data),
  cancelBooking: (data) => client.post("/self-service/cancel", data),

  // Diagnostics & Heartbeat
  getHealth: () => client.get("/system/health"),
};
