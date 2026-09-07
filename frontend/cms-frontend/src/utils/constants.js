// ── Design tokens mirrored as JS constants for use in dynamic class generation
// These match the visual language from the prototype (light theme).
// Use Tailwind utilities wherever possible; use these for dynamic/computed values.

// Color palette constants
export const COLORS = {
  navy: '#0F172A',   // NAV bg / dark header
  card: '#FFFFFF',
  surface: '#F1F5F9',
  surfaceAlt: '#F8FAFC',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  saffron: '#F97316',   // primary accent
  saffronDim: 'rgba(249,115,22,0.10)',
  text: '#0F172A',   // main text
  textMid: '#475569',
  textMuted: '#94A3B8',
  white: '#FFFFFF',
  green: '#16a34a',
  red: '#dc2626',
  yellow: '#eab308',
  blue: '#1e3a8a',
}

// Nav header colors (always dark regardless of page theme)
export const NAV = {
  bg: '#0F172A',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.08)',
}

// Menu item status metadata
export const STATUS_META = {
  ACT: { label: 'Active', colors: { bg: 'rgba(22,163,74,0.10)', text: '#16a34a', border: 'rgba(22,163,74,0.25)' } },
  DIS: { label: 'Deactivated', colors: { bg: 'rgba(220,38,38,0.09)', text: '#dc2626', border: 'rgba(220,38,38,0.2)' } },
  P: { label: 'Pending', colors: { bg: 'rgba(202,138,4,0.10)', text: '#b45309', border: 'rgba(202,138,4,0.22)' } },
  EXP: { label: 'Expired', colors: { bg: 'rgba(100,116,139,0.10)', text: '#64748b', border: 'rgba(100,116,139,0.22)' } },
  BLK: { label: 'Blocked', colors: { bg: 'rgba(124,58,237,0.09)', text: '#7c3aed', border: 'rgba(124,58,237,0.2)' } },
}

// Booking status metadata
export const BOOKING_STATUS_META = {
  CRT: { label: 'Confirmed', bg: 'rgba(30,58,138,0.10)', text: '#1e3a8a', border: 'rgba(30,58,138,0.22)', dot: '#1e3a8a' },
  SRV: { label: 'Served', bg: 'rgba(22,163,74,0.10)', text: '#16a34a', border: 'rgba(22,163,74,0.22)', dot: '#16a34a' },
  CAN: { label: 'Cancelled', bg: 'rgba(220,38,38,0.09)', text: '#dc2626', border: 'rgba(220,38,38,0.2)', dot: '#dc2626' },
  NOS: { label: 'No-Show', bg: 'rgba(100,116,139,0.10)', text: '#64748b', border: 'rgba(100,116,139,0.22)', dot: '#64748b' },
  PRT: { label: 'Partial', bg: 'rgba(234,179,8,0.10)', text: '#b45309', border: 'rgba(234,179,8,0.25)', dot: '#eab308' },
}



// Wallet withdrawal status metadata
export const WITHDRAWAL_STATUS = {
  REQ: { label: 'Requested', bg: 'rgba(250,204,21,0.12)', text: '#b45309', border: 'rgba(250,204,21,0.3)' },
  COM: { label: 'Completed', bg: 'rgba(22,163,74,0.10)', text: '#16a34a', border: 'rgba(22,163,74,0.22)' },
  REJ: { label: 'Rejected', bg: 'rgba(220,38,38,0.09)', text: '#dc2626', border: 'rgba(220,38,38,0.2)' },
  CAN: { label: 'Cancelled', bg: 'rgba(100,116,139,0.10)', text: '#64748b', border: 'rgba(100,116,139,0.22)' },
}

// Payment methods for wallet top-up
export const PAYMENT_METHODS = [
  { code: 'CASH', label: 'Cash' },
  { code: 'UPI', label: 'UPI' },
  { code: 'NEFT', label: 'NEFT' },
  { code: 'CHEQUE', label: 'Cheque' },
]

// Customer types (from /api/common/customer-types)
export const CUSTOMER_TYPES = [
  { code: 'PERMEMP', label: 'Permanent Employee', desc: 'ISRO permanent staff', color: '#1e3a8a' },
  { code: 'CONTEMP', label: 'Contract Employee', desc: 'Contract/vendor staff', color: '#7c3aed' },
  { code: 'TRAINEE', label: 'Trainee', desc: 'Interns and trainees', color: '#0f766e' },
  { code: 'GUEST', label: 'Guest', desc: 'External visitors/guests', color: '#64748b' },
]

// Backend role codes → display labels
// SYSTEMROLES:  ADMIN
// CANTEENROLES: CNTMGR (manager), CNTAST (assistant), CNTSTF (staff/kiosk)
export const ROLE_META = {
  SYSADM: { label: 'Administrator' },
  CNTMGR: { label: 'Canteen Manager' },
  CNTAST: { label: 'Canteen Assistant' },
  CNTSTF: { label: 'Canteen Staff' },
}

// Day menu status pill colors
export const DAYMENU_STATUS = {
  PENDING: { label: 'Pending', bg: 'rgba(250,204,21,0.12)', text: '#b45309', border: 'rgba(250,204,21,0.3)' },
  APPROVED: { label: 'Approved', bg: 'rgba(22,163,74,0.12)', text: '#16a34a', border: 'rgba(22,163,74,0.25)' },
  REJECTED: { label: 'Rejected', bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' },
}
