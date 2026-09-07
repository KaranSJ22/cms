import axios from "../../../config/axios";

const BASE_PATH = "/identity";

export const identityApi = {
  getUsers: () => axios.get(`${BASE_PATH}/users`),
  createUser: (data) => axios.post(`${BASE_PATH}/users`, data),
  assignUserRole: (data) => axios.post(`${BASE_PATH}/user-roles`, data),
  getRoles: () => axios.get(`${BASE_PATH}/roles`),
  getCustomers: () => axios.get(`${BASE_PATH}/customers`),
  createCustomer: (data) => axios.post(`${BASE_PATH}/customers`, data),
};
