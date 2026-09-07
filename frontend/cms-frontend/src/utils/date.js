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

/** Returns today's ISO date string → "2026-08-16" */
export function today() {
  return new Date().toISOString().split('T')[0]
}

/** Check if an ISO date is a Sunday */
export function isSunday(iso) {
  return new Date(iso + 'T00:00:00').getDay() === 0
}

/** Check if an ISO date is a Saturday */
export function isSaturday(iso) {
  return new Date(iso + 'T00:00:00').getDay() === 6
}

/** Generate next N working days starting from tomorrow */
export function nextWorkingDays(n) {
  const dates = []
  const base = new Date()
  base.setDate(base.getDate() + 1)
  let added = 0
  while (added < n) {
    const iso = base.toISOString().split('T')[0]
    if (base.getDay() !== 0) { // skip Sundays only
      dates.push(iso)
      added++
    }
    base.setDate(base.getDate() + 1)
  }
  return dates
}
