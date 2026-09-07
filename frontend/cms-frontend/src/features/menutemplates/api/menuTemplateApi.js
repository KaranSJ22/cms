import axios from "../../../config/axios";

const BASE_PATH = "/menu-templates";

export const menuTemplateApi = {
  getTemplates: (params) => axios.get(BASE_PATH, { params }),
  getTemplate: (id) => axios.get(`${BASE_PATH}/${id}`),
  createTemplate: (data) => axios.post(BASE_PATH, data),
  updateTemplate: (id, data) => axios.put(`${BASE_PATH}/${id}`, data),
  deactivateTemplate: (id) => axios.delete(`${BASE_PATH}/${id}`),
  
  getTemplateDetails: (id) => axios.get(`${BASE_PATH}/${id}/details`),
  addTemplateDetail: (id, data) => axios.post(`${BASE_PATH}/${id}/details`, data),
  removeTemplateDetail: (id, dtId) => axios.delete(`${BASE_PATH}/details/${dtId}`),
  
  bulkGenerateMenu: (data) => axios.post(`${BASE_PATH}/bulk-generate`, data),
  generateTemplateDraft: (params) => axios.get(`${BASE_PATH}/generate-draft`, { params }),
};
