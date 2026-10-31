import api from '../../../config/axios';

export const canteenService = {
  // Canteens
  getCanteens: async (centerId = null) => {
    const params = centerId ? { CENTERID: centerId } : {};
    const response = await api.get('/canteens', { params });
    return response.data?.DATA || [];
  },

  getCanteenById: async (canteenId) => {
    const response = await api.get(`/canteens/${canteenId}`);
    return response.data?.DATA || null;
  },

  createCanteen: async (canteenData) => {
    const response = await api.post('/canteens', canteenData);
    return response.data?.DATA || null;
  },

  updateCanteen: async (canteenId, canteenData) => {
    const response = await api.put(`/canteens/${canteenId}`, canteenData);
    return response.data?.DATA || null;
  },

  deactivateCanteen: async (canteenId) => {
    const response = await api.delete(`/canteens/${canteenId}`);
    return response.data?.DATA || null;
  },

  // Campus Centers
  getCenters: async () => {
    const response = await api.get('/canteens/centers');
    return response.data?.DATA || [];
  },

  createCenter: async (centerData) => {
    const response = await api.post('/canteens/centers', centerData);
    return response.data?.DATA || null;
  },
};
