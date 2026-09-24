import api from '../../../config/axios'

/** GET /api/wallets/customer-lookup/:identifier  (ADMIN, CNTMGR, CNTAST) */
export async function lookupCustomerForWallet(identifier) {
  const res = await api.get(`/wallets/customer-lookup/${encodeURIComponent(identifier)}`)
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
  const data = res.data.DATA || []
  if (res.data.PAGINATION && Array.isArray(data)) {
    data.pagination = res.data.PAGINATION
  }
  return data
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

/** POST /api/wallets/withdraw/:walletWdId/approve  (ADMIN, CNTMGR, CNTAST) */
export async function approveWithdrawal(walletWdId, body = {}) {
  const res = await api.post(`/wallets/withdraw/${walletWdId}/approve`, body)
  return res.data.DATA
}

/** POST /api/wallets/withdraw/:walletWdId/reject  (ADMIN, CNTMGR, CNTAST) */
export async function rejectWithdrawal(walletWdId, body) {
  const res = await api.post(`/wallets/withdraw/${walletWdId}/reject`, body)
  return res.data.DATA
}

/** POST /api/wallets/withdraw/:walletWdId/cancel  (authenticated: customer or staff) */
export async function cancelWithdrawal(walletWdId, body = {}) {
  const res = await api.post(`/wallets/withdraw/${walletWdId}/cancel`, body)
  return res.data.DATA
}

