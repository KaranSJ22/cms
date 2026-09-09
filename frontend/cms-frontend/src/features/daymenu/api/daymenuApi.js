import api from '../../../config/axios'

/** GET /api/day-menus/slots/:daySlotId */
export async function getDayMenuWorkspace(daySlotId) {
  const res = await api.get(`/day-menus/slots/${daySlotId}`)
  return res.data.DATA
}

/** PUT /api/day-menus/slots/:daySlotId */
export async function replaceDayMenuItems(daySlotId, itemsJson) {
  const res = await api.put(`/day-menus/slots/${daySlotId}`, { ITEMSJSON: itemsJson })
  return res.data.DATA
}

/** POST /api/day-menus/slots/:daySlotId/submit */
export async function submitDayMenu(daySlotId) {
  const res = await api.post(`/day-menus/slots/${daySlotId}/submit`)
  return res.data.DATA
}

/** POST /api/day-menus/slots/:daySlotId/approve */
export async function approveDayMenu(daySlotId, remarks = null) {
  const res = await api.post(`/day-menus/slots/${daySlotId}/approve`, { REMARKS: remarks })
  return res.data.DATA
}

/** POST /api/day-menus/slots/:daySlotId/reject */
export async function rejectDayMenu(daySlotId, remarks = null) {
  const res = await api.post(`/day-menus/slots/${daySlotId}/reject`, { REMARKS: remarks })
  return res.data.DATA
}

/** GET /api/day-menus/pending */
export async function getPendingDayMenus(canteenId = null) {
  const params = canteenId ? { canteenId } : {};
  const res = await api.get('/day-menus/pending', { params })
  return res.data.DATA
}

/** GET /api/day-menus/published */
export async function getPublishedMenus(params = {}) {
  const res = await api.get('/day-menus/published', { params })
  return res.data.DATA
}
