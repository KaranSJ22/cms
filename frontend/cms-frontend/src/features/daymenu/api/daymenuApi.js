import api from '../../../config/axios'

/** GET /api/day-menus  (CTNMNG, CTNAST) */
export async function getDayMenus(params = {}) {
  const res = await api.get('/day-menus', { params })
  return res.data.DATA
}

/** GET /api/day-menus/:id  (CTNMNG, CTNAST) */
export async function getDayMenu(id) {
  const res = await api.get(`/day-menus/${id}`)
  return res.data.DATA
}

/** POST /api/day-menus  (CTNMNG, CTNAST) */
export async function createDayMenu(body) {
  const res = await api.post('/day-menus', body)
  return res.data.DATA
}

/** PATCH /api/day-menus/:id/approve  (CTNMNG only) */
export async function approveDayMenu(id, body = {}) {
  const res = await api.patch(`/day-menus/${id}/approve`, body)
  return res.data.DATA
}

/** PATCH /api/day-menus/:id/reject  (CTNMNG only) */
export async function rejectDayMenu(id, body = {}) {
  const res = await api.patch(`/day-menus/${id}/reject`, body)
  return res.data.DATA
}

/** GET /api/menus  (authenticated — published menus for pre-booking) */
export async function getPublishedMenus(params = {}) {
  const res = await api.get('/menus', { params })
  return res.data.DATA
}
