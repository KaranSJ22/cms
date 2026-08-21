import api from '../../../config/axios'

/** GET /api/bookings  (authenticated) */
export async function getBookings(params = {}) {
  const res = await api.get('/bookings', { params })
  return res.data.DATA
}

/** GET /api/bookings/kitchen-prep  (authenticated) */
export async function getKitchenPrep(daySlotId) {
  const res = await api.get('/bookings/kitchen-prep', { params: { daySlotId } })
  return res.data.DATA
}

/** GET /api/bookings/:id  (authenticated) */
export async function getBooking(id) {
  const res = await api.get(`/bookings/${id}`)
  return res.data.DATA
}

/** POST /api/bookings  (authenticated) */
export async function createBooking(body) {
  const res = await api.post('/bookings', body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/cancel  (authenticated) */
export async function cancelBooking(id, body = {}) {
  const res = await api.patch(`/bookings/${id}/cancel`, body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/serve  (CTNMNG, CTNSTF) */
export async function serveBooking(id, body = {}) {
  const res = await api.patch(`/bookings/${id}/serve`, body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/no-show  (CTNMNG, CTNSTF) */
export async function noShowBooking(id, body = {}) {
  const res = await api.patch(`/bookings/${id}/no-show`, body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/items/:itemId/serve  (CTNMNG, CTNSTF) */
export async function serveBookingItem(id, itemId, body = {}) {
  const res = await api.patch(`/bookings/${id}/items/${itemId}/serve`, body)
  return res.data.DATA
}

/** POST /api/bookings/scan-rfid  (CTNMNG, CTNSTF) */
export async function scanRfid(body) {
  const res = await api.post('/bookings/scan-rfid', body)
  return res.data.DATA
}

/** PATCH /api/bookings/kiosk-toggle/:dayMenuId  (CTNMNG, CTNSTF) */
export async function toggleKiosk(dayMenuId, body) {
  const res = await api.patch(`/bookings/kiosk-toggle/${dayMenuId}`, body)
  return res.data.DATA
}

/** GET /api/bookings/resolve/:identifier (CTNMNG, CTNSTF) */
export async function resolveBooking(identifier) {
  const res = await api.get(`/bookings/resolve/${identifier}`)
  return res.data.DATA
}
