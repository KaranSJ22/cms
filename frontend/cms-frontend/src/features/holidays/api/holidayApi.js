import axios from "../../../config/axios";

const BASE_PATH = "/holidays";

export const holidayApi = {
  getHolidays: (params) => axios.get(BASE_PATH, { params }),
  getHoliday: (id) => axios.get(`${BASE_PATH}/${id}`),
  createHoliday: (data) => axios.post(BASE_PATH, data),
  updateHoliday: (id, data) => axios.put(`${BASE_PATH}/${id}`, data),
  deactivateHoliday: (id) => axios.patch(`${BASE_PATH}/${id}/deactivate`),
};
