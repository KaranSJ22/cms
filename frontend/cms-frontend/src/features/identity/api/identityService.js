import api from '../../../config/axios';

export const identityService = {
  // Users (Directory Lookup)
  getUsers: async () => {
    const response = await api.get('/identity/users');
    return response.data.DATA;
  },
  
  // Roles & System Role Assignment
  getRoles: async () => {
    const response = await api.get('/identity/roles');
    return response.data.DATA;
  },
  assignUserRole: async (roleData) => {
    const response = await api.post('/identity/user-roles', roleData);
    return response.data.DATA;
  },

  // Canteen Role Governance (CNTMGR, CNTAST, CNTSTF)
  assignCanteenRole: async (canteenRoleData) => {
    const response = await api.post('/identity/canteen-roles', canteenRoleData);
    return response.data.DATA;
  },
  removeCanteenRole: async (canteenRoleData) => {
    const response = await api.delete('/identity/canteen-roles', { data: canteenRoleData });
    return response.data.DATA;
  },
  getCanteenRoles: async (userId) => {
    const response = await api.get(`/identity/canteen-roles/${userId}`);
    return response.data.DATA;
  },

  // Customers (Directory Lookup)
  getCustomers: async () => {
    const response = await api.get('/identity/customers');
    return response.data.DATA;
  },
};
