import api from '../../../config/axios'

/**
 * Pricing routes are mounted at /api (not /api/pricing)
 * because pricing.routes.js is mounted with router.use("/", pricingRoutes)
 */

/** POST /api/menu-items/:menuItemId/prices  (CTNMNG, CTNAST) */
export async function createItemPrice(menuItemId, body) {
  const res = await api.post(`/menu-items/${menuItemId}/prices`, body)
  return res.data.DATA
}

/** GET /api/menu-items/:menuItemId/prices  (CTNMNG, CTNAST) — price history */
export async function getItemPriceHistory(menuItemId, params = {}) {
  const res = await api.get(`/menu-items/${menuItemId}/prices`, { params })
  return res.data.DATA
}

/** GET /api/menu-items/:menuItemId/prices/effective  (authenticated) — all effective prices */
export async function getEffectiveItemPrices(menuItemId, params = {}) {
  const res = await api.get(`/menu-items/${menuItemId}/prices/effective`, { params })
  return res.data.DATA
}

/** GET /api/menu-items/:menuItemId/prices/effective/:customerTypeCode  (authenticated) */
export async function getEffectiveItemPrice(menuItemId, customerTypeCode) {
  const res = await api.get(`/menu-items/${menuItemId}/prices/effective/${customerTypeCode}`)
  return res.data.DATA
}

/** PATCH /api/item-prices/:itemPriceId/deactivate  (CTNMNG, CTNAST) */
export async function deactivateItemPrice(itemPriceId) {
  const res = await api.patch(`/item-prices/${itemPriceId}/deactivate`)
  return res.data.DATA
}
