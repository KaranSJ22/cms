import api from '../../../config/axios'

/** GET /api/wallets/customer-lookup/:customerId  (CTNMGR) */
export async function lookupCustomerForWallet(customerId) {
  const res = await api.get(`/wallets/customer-lookup/${customerId}`)
  return res.data.DATA
}

/** POST /api/wallets  (ADMIN, CTNMGR) */
export async function createWallet(body) {
  const res = await api.post('/wallets', body)
  return res.data.DATA
}

/** POST /api/wallets/topup  (ADMIN, CTNMGR) */
export async function topupWallet(body) {
  const res = await api.post('/wallets/topup', body)
  return res.data.DATA
}

/** GET /api/wallets/customer/:customerId  (authenticated) */
export async function fetchWallet(customerId) {
  const res = await api.get(`/wallets/customer/${customerId}`)
  return res.data.DATA
}

/** GET /api/wallets/customer/:customerId/transactions  (authenticated) */
export async function fetchWalletTransactions(customerId, params = {}) {
  const res = await api.get(`/wallets/customer/${customerId}/transactions`, { params })
  return res.data.DATA
}

/** POST /api/wallets/withdraw/request  (authenticated) */
export async function requestWithdrawal(body) {
  const res = await api.post('/wallets/withdraw/request', body)
  return res.data.DATA
}

/** GET /api/wallets/withdraw/requests  (ADMIN, CTNMGR) */
export async function fetchWithdrawals(params = {}) {
  const res = await api.get('/wallets/withdraw/requests', { params })
  return res.data.DATA
}

/** POST /api/wallets/withdraw/:walletWdId/approve  (ADMIN, CTNMGR) */
export async function approveWithdrawal(walletWdId) {
  const res = await api.post(`/wallets/withdraw/${walletWdId}/approve`)
  return res.data.DATA
}

/** POST /api/wallets/withdraw/:walletWdId/reject  (ADMIN, CTNMGR) */
export async function rejectWithdrawal(walletWdId, body) {
  const res = await api.post(`/wallets/withdraw/${walletWdId}/reject`, body)
  return res.data.DATA
}
