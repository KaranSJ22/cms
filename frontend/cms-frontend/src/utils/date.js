/**
 * Date formatting utilities
 */

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/** Format ISO date string → "14 Aug 2026" */
export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[+m - 1]} ${y}`
}

/** Format ISO date string → "Monday, 14 Aug 2026" */
export function formatFullDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Returns today's ISO date string in IST → "2026-08-16" */
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

/** Check if an ISO date is a Sunday */
export function isSunday(iso) {
  return new Date(iso + 'T00:00:00').getDay() === 0
}

/** Check if an ISO date is a Saturday */
export function isSaturday(iso) {
  return new Date(iso + 'T00:00:00').getDay() === 6
}

/** Generate next N working days starting from tomorrow in IST */
export function nextWorkingDays(n) {
  const dates = []
  const [y, m, d] = today().split('-').map(Number)
  const base = new Date(y, m - 1, d)
  base.setDate(base.getDate() + 1)
  let added = 0
  while (added < n) {
    const year = base.getFullYear()
    const month = String(base.getMonth() + 1).padStart(2, '0')
    const day = String(base.getDate()).padStart(2, '0')
    const iso = `${year}-${month}-${day}`
    if (base.getDay() !== 0) { // skip Sundays only
      dates.push(iso)
      added++
    }
    base.setDate(base.getDate() + 1)
  }
  return dates
}

/**
 * Returns Monday ISO date string for given week offset or date string
 * @param {number|string} offsetOrDateStr - week offset (number, 0 = current) or 'YYYY-MM-DD'
 * @returns {string} 'YYYY-MM-DD'
 */
export function getMonday(offsetOrDateStr = 0) {
  if (typeof offsetOrDateStr === 'string') {
    if (!offsetOrDateStr) return ''
    const [y, m, dayNum] = offsetOrDateStr.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, dayNum))
    const day = dt.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day
    dt.setUTCDate(dt.getUTCDate() + diff)
    return dt.toISOString().slice(0, 10)
  }
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offsetOrDateStr * 7
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return formatDateISO(monday)
}

/**
 * Returns a Date object representing Monday for a given week offset (0 = current week)
 * @param {number} offsetWeeks
 * @returns {Date}
 */
export function getMondayDate(offsetWeeks = 0) {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offsetWeeks * 7
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** Format Date object to 'YYYY-MM-DD' */
export function formatDateISO(d) {
  if (!d) return ''
  const dateObj = typeof d === 'string' ? new Date(d) : d
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Add N days to 'YYYY-MM-DD' string */
export function addDays(dateStr, d) {
  if (!dateStr) return ''
  const [y, m, dayNum] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, dayNum + d))
  return dt.toISOString().slice(0, 10)
}

/** Format ISO datetime or string to Indian locale short date */
export function formatEventDate(dt) {
  if (!dt) return '—'
  const d = new Date(typeof dt === 'string' ? dt.replace(' ', 'T') : dt)
  if (isNaN(d.getTime())) return String(dt)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Format ISO datetime or string to HH:MM (24h) */
export function formatEventTime(dt) {
  if (!dt) return '—'
  const d = new Date(typeof dt === 'string' ? dt.replace(' ', 'T') : dt)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
