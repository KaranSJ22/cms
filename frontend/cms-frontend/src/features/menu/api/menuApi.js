import api from '../../../config/axios'

/** GET /api/menu-items */
export async function getMenuItems(params = {}) {
  const res = await api.get('/menu-items', { params })
  return res.data.DATA
}

/** GET /api/menu-items/:id */
export async function getMenuItem(id) {
  const res = await api.get(`/menu-items/${id}`)
  return res.data.DATA
}

/** POST /api/menu-items */
export async function createMenuItem(body) {
  const res = await api.post('/menu-items', body)
  return res.data.DATA
}

/** PUT /api/menu-items/:id */
export async function updateMenuItem(id, body) {
  const res = await api.put(`/menu-items/${id}`, body)
  return res.data.DATA
}

/** GET /api/menu-items/:id/price-readiness */
export async function checkPriceReadiness(id, serviceDate) {
  const res = await api.get(`/menu-items/${id}/price-readiness`, { params: { serviceDate } })
  return res.data
}

export const menuApi = {
  getMenus: getMenuItems,
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  checkPriceReadiness,
}

export default menuApi

