import api from '../../config/axios'

/** GET /api/day-slots */
export async function getDaySlots(params = {}) {
  const res = await api.get('/day-slots', { params })
  return res.data.DATA
}

/** GET /api/day-slots/:id */
export async function getDaySlot(id) {
  const res = await api.get(`/day-slots/${id}`)
  return res.data.DATA
}

/** POST /api/day-slots */
export async function createDaySlot(body) {
  const res = await api.post('/day-slots', body)
  return res.data.DATA
}

/** PUT /api/day-slots/:id */
export async function updateDaySlot(id, body) {
  const res = await api.put(`/day-slots/${id}`, body)
  return res.data.DATA
}
