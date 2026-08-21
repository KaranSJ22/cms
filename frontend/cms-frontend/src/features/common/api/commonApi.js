import api from '../../../config/axios'

/** GET /api/common/status */
export async function getStatusCodes() {
  const res = await api.get('/common/status')
  return res.data.DATA
}

/** GET /api/common/customer-types */
export async function getCustomerTypes() {
  const res = await api.get('/common/customer-types')
  return res.data.DATA
}

/** GET /api/common/screens (ADMIN only) */
export async function getScreens() {
  const res = await api.get('/common/screens')
  return res.data.DATA
}

/** GET /api/common/autonos (ADMIN only) */
export async function getAutonos() {
  const res = await api.get('/common/autonos')
  return res.data.DATA
}
