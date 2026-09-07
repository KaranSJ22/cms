import api from '../../../config/axios'

/**
 * POST /api/day-menus/bulk
 * Roles: CTNMGR, CTNAST
 *
 * @param {object} payload
 * @param {number} payload.CANTEENID
 * @param {number} payload.SERVICEID
 * @param {string} payload.STARTDATE  - 'YYYY-MM-DD'
 * @param {string} payload.STARTTIME  - 'HH:MM' or 'HH:MM:SS'
 * @param {string} payload.ENDTIME    - 'HH:MM' or 'HH:MM:SS'
 * @param {Array}  payload.ITEMS      - array of menu item config objects
 *
 * @returns {Promise<Array<{date, daySlotId, slotNo, isNewSlot, itemsInserted}>>}
 */
export async function bulkCreateDayMenus(payload) {
  const res = await api.post('/day-menus/bulk', payload)
  return res.data.DATA
}
