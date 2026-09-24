/**
 * Resolves a meal service name to its appropriate emoji icon
 * @param {string} name - Service name (e.g. "Breakfast", "Lunch", "Evening Snacks")
 * @returns {string} Emoji string
 */
export function getServiceEmoji(name = '') {
  const n = (name || '').toLowerCase()
  if (n.includes('breakfast') || n.includes('morning')) return '🍳'
  if (n.includes('lunch') || n.includes('afternoon')) return '🍛'
  if (n.includes('snack') || n.includes('tea') || n.includes('coffee')) return '☕'
  if (n.includes('dinner') || n.includes('night') || n.includes('tiffin')) return '🍲'
  return '🍱'
}

export default getServiceEmoji
