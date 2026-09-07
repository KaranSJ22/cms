import api from '../../../config/axios';

export const identityService = {
  // Users
  getUsers: async () => {
    const response = await api.get('/identity/users');
    return response.data.DATA;
  },
  createUser: async (userData) => {
    const response = await api.post('/identity/users', userData);
    return response.data.DATA;
  },
  
  // Roles
  getRoles: async () => {
    const response = await api.get('/identity/roles');
    return response.data.DATA;
  },
  assignUserRole: async (roleData) => {
    const response = await api.post('/identity/user-roles', roleData);
    return response.data.DATA;
  },

  // Customers
  getCustomers: async () => {
    const response = await api.get('/identity/customers');
    return response.data.DATA;
  },
  createCustomer: async (customerData) => {
    const response = await api.post('/identity/customers', customerData);
    return response.data.DATA;
  }
};
