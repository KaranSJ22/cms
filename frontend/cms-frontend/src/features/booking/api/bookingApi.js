import api from '../../../config/axios'

/** GET /api/bookings  (authenticated) */
export async function getBookings(params = {}) {
  const res = await api.get('/bookings', { params })
  return res.data.DATA
}

/** GET /api/bookings/active  (authenticated) */
export async function getActiveBooking(params = {}) {
  const res = await api.get('/bookings/active', { params })
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

/** POST /api/bookings/:id/items  (authenticated - incremental item add) */
export async function addBookingItem(bookingId, body) {
  const res = await api.post(`/bookings/${bookingId}/items`, body)
  return res.data.DATA
}

/** PUT /api/bookings/:id/items/:itemId  (authenticated - incremental qty update) */
export async function updateBookingItemQty(bookingId, itemId, body) {
  const res = await api.put(`/bookings/${bookingId}/items/${itemId}`, body)
  return res.data.DATA
}

/** Legacy alias: PUT /api/bookings/:id/items/:itemId */
export async function updateBookingItem(id, itemId, body) {
  const res = await api.put(`/bookings/${id}/items/${itemId}`, body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/items/:itemId/cancel  (authenticated - incremental item soft-cancel) */
export async function cancelBookingItem(bookingId, itemId, body = {}) {
  const res = await api.patch(`/bookings/${bookingId}/items/${itemId}/cancel`, body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/cancel  (authenticated) */
export async function cancelBooking(id, body = {}) {
  const res = await api.patch(`/bookings/${id}/cancel`, body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/serve  (CTNMGR, CTNSTF) */
export async function serveBooking(id, body = {}) {
  const res = await api.patch(`/bookings/${id}/serve`, body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/no-show  (CTNMGR, CTNSTF) */
export async function noShowBooking(id, body = {}) {
  const res = await api.patch(`/bookings/${id}/no-show`, body)
  return res.data.DATA
}

/** PATCH /api/bookings/:id/items/:itemId/serve  (CTNMGR, CTNSTF) */
export async function serveBookingItem(id, itemId, body = {}) {
  const res = await api.patch(`/bookings/${id}/items/${itemId}/serve`, body)
  return res.data.DATA
}

/** POST /api/bookings/scan-rfid  (CTNMGR, CTNSTF) */
export async function scanRfid(body) {
  const res = await api.post('/bookings/scan-rfid', body)
  return res.data.DATA
}

/** PATCH /api/bookings/kiosk-toggle/:dayMenuId  (CTNMGR, CTNSTF) */
export async function toggleKiosk(dayMenuId, body) {
  const res = await api.patch(`/bookings/kiosk-toggle/${dayMenuId}`, body)
  return res.data.DATA
}

/** GET /api/bookings/resolve/:identifier (CTNMGR, CTNSTF) */
export async function resolveBooking(identifier, params = {}) {
  const res = await api.get(`/bookings/resolve/${identifier}`, { params })
  return res.data.DATA
}

/** GET /api/bookings/weekly-menu (authenticated) */
export async function getWeeklyPublishedMenu(params = {}) {
  const res = await api.get('/bookings/weekly-menu', { params })
  return res.data.DATA
}

/** POST /api/bookings/weekly-batch (authenticated) */
export async function createWeeklyBookingBatch(body) {
  const res = await api.post('/bookings/weekly-batch', body)
  return res.data.DATA
}
