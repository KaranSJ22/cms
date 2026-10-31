import api from '../../../config/axios';

export const kioskDeviceService = {
  // List all registered hardware terminals, optionally filtered by canteen
  getDevices: async (canteenId = null) => {
    const params = canteenId ? { canteenId } : {};
    const response = await api.get('/kiosk/devices', { params });
    return response.data?.DATA || [];
  },

  // Get fleet telemetry summary (Total, Online, Stale, Offline, by type)
  getTelemetry: async () => {
    const response = await api.get('/kiosk/devices/telemetry');
    return response.data?.DATA || { summary: {}, devices: [] };
  },

  // Get single device configuration details
  getDeviceById: async (kioskId) => {
    const response = await api.get(`/kiosk/devices/${kioskId}`);
    return response.data?.DATA || null;
  },

  // Register a new physical terminal or update existing device configuration
  registerDevice: async (deviceData) => {
    const response = await api.post('/kiosk/devices', deviceData);
    return response.data?.DATA || null;
  },

  // Enable or disable/retire a hardware terminal (STATUSID: 10 = ACT, 11 = DIS)
  updateStatus: async (kioskId, statusId) => {
    const response = await api.put(`/kiosk/devices/${kioskId}/status`, { STATUSID: statusId });
    return response.data?.DATA || null;
  },
};
