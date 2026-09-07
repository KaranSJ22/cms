import api from '../../../config/axios'

/** GET /api/day-slots/:id/menu */
export async function getDayMenuWorkspace(daySlotId) {
  const res = await api.get(`/day-slots/${daySlotId}/menu`)
  return res.data.DATA
}

/** PUT /api/day-slots/:id/menu */
export async function replaceDayMenuItems(daySlotId, itemsJson) {
  const res = await api.put(`/day-slots/${daySlotId}/menu`, { ITEMSJSON: itemsJson })
  return res.data.DATA
}

/** POST /api/day-slots/:id/menu/submit */
export async function submitDayMenu(daySlotId) {
  const res = await api.post(`/day-slots/${daySlotId}/menu/submit`)
  return res.data.DATA
}

/** POST /api/day-slots/:id/menu/approve */
export async function approveDayMenu(daySlotId, remarks = null) {
  const res = await api.post(`/day-slots/${daySlotId}/menu/approve`, { REMARKS: remarks })
  return res.data.DATA
}

/** POST /api/day-slots/:id/menu/reject */
export async function rejectDayMenu(daySlotId, remarks = null) {
  const res = await api.post(`/day-slots/${daySlotId}/menu/reject`, { REMARKS: remarks })
  return res.data.DATA
}

/** GET /api/day-menus/pending */
export async function getPendingDayMenus(canteenId = null) {
  const params = canteenId ? { canteenId } : {};
  const res = await api.get('/day-menus/pending', { params })
  return res.data.DATA
}

/** GET /api/menus */
export async function getPublishedMenus(params = {}) {
  const res = await api.get('/menus', { params })
  return res.data.DATA
}
