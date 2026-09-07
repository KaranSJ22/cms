/** Format a number as Indian Rupees: ₹1,234.50 */
export function formatINR(amount) {
  if (amount == null) return '—'
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Pad a number to 2 digits */
export function pad2(n) {
  return String(n).padStart(2, '0')
}
