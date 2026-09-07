import axios from "../../../config/axios";

const BASE_PATH = "/kiosk";

export const kioskApi = {
  // Device Handshake
  getConfig: () => axios.get(`${BASE_PATH}/config`),

  // Employee Self-Service Operations
  scanSelfService: (data) => axios.post(`${BASE_PATH}/self-service/scan`, data),
  getNextDayMenu: (canteenId) =>
    axios.get(`${BASE_PATH}/self-service/menu`, { params: { canteenId } }),
  bookNextDay: (data) => axios.post(`${BASE_PATH}/self-service/book`, data),
  cancelBooking: (data) => axios.post(`${BASE_PATH}/self-service/cancel`, data),

  // Staff Counter Operations
  getCurrentSlot: (canteenId, kioskId) =>
    axios.get(`${BASE_PATH}/current-slot`, { params: { canteenId, kioskId } }),
  resolveBooking: (identifier, params = {}) =>
    axios.get(`${BASE_PATH}/resolve/${encodeURIComponent(identifier)}`, { params }),
  serveBooking: (data) =>
    axios.post(`${BASE_PATH}/serve`, data),

  // Canteen & Meal Slot Discovery
  getCanteens: () => axios.get(`${BASE_PATH}/canteens`),
  getTodaySlots: (canteenId) =>
    axios.get(`${BASE_PATH}/today-slots`, { params: { canteenId } }),

  // Heartbeat
  sendHeartbeat: (kioskId) => axios.post(`${BASE_PATH}/heartbeat`, { KIOSKID: kioskId }),

  // Legacy
  scanServe: (data) => axios.post(`${BASE_PATH}/scan-serve`, data),
};


