import api from '../../../config/axios'

/**
 * Pricing routes are mounted at /api/pricing
 */

/** POST /api/pricing/menu-items/:menuItemId  (CTNMGR, CTNAST) */
export async function createItemPrice(menuItemId, body) {
  const res = await api.post(`/pricing/menu-items/${menuItemId}`, body)
  return res.data.DATA
}

/** GET /api/pricing/menu-items/:menuItemId  (CTNMGR, CTNAST) — price history */
export async function getItemPriceHistory(menuItemId, params = {}) {
  const res = await api.get(`/pricing/menu-items/${menuItemId}`, { params })
  return res.data.DATA
}

/** GET /api/pricing/menu-items/:menuItemId/effective  (authenticated) — all effective prices */
export async function getEffectiveItemPrices(menuItemId, params = {}) {
  const res = await api.get(`/pricing/menu-items/${menuItemId}/effective`, { params })
  return res.data.DATA
}

/** GET /api/pricing/menu-items/:menuItemId/effective/:customerTypeCode  (authenticated) */
export async function getEffectiveItemPrice(menuItemId, customerTypeCode) {
  const res = await api.get(`/pricing/menu-items/${menuItemId}/effective/${customerTypeCode}`)
  return res.data.DATA
}

/** PATCH /api/pricing/item-prices/:itemPriceId/deactivate  (CTNMGR, CTNAST) */
export async function deactivateItemPrice(itemPriceId) {
  const res = await api.patch(`/pricing/item-prices/${itemPriceId}/deactivate`)
  return res.data.DATA
}
