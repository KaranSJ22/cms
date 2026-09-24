import api from '../../../config/axios'

/** GET /api/services */
export async function getServices(params = {}) {
  const res = await api.get('/services', { params })
  return res.data.DATA || res.data.data || res.data || []
}

/** GET /api/services/:id */
export async function getService(id) {
  const res = await api.get(`/services/${id}`)
  return res.data.DATA || res.data.data || res.data
}

/** POST /api/services */
export async function createService(body) {
  const res = await api.post('/services', body)
  return res.data.DATA
}

/** PUT /api/services/:id */
export async function updateService(id, body) {
  const res = await api.put(`/services/${id}`, body)
  return res.data.DATA
}
