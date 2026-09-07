// All SVG icon components used throughout the CMS frontend
// Ported from the JSX prototype's Icons.jsx

export function Emblem({ size = 40 }) {
  const inner = size * 0.43
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'conic-gradient(#FF9933 0deg 120deg,#fff 120deg 240deg,#138808 240deg 360deg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 ${size * 0.05}px #FFFFFF, 0 0 0 ${size * 0.09}px rgba(249,115,22,0.3)`,
      }}
    >
      <div
        style={{
          width: inner, height: inner, borderRadius: '50%',
          backgroundColor: '#00317a',
          border: `${size * 0.035}px solid rgba(255,255,255,0.9)`,
        }}
      />
    </div>
  )
}

export function Spinner({ color = '#0b1e3d' }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 16 16" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="2"
        strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5a4 4 0 0 0-4 4v1H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-1v-1a4 4 0 0 0-4-4zm0 1.5a2.5 2.5 0 0 1 2.5 2.5V7h-5V5.5A2.5 2.5 0 0 1 8 3zm0 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
        fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export function SearchIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${className}`}
    >
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function CalendarIcon({ size = 16, color = '#94A3B8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="11.5" rx="2" stroke={color} strokeWidth="1.3" />
      <path d="M5 1.5v3M11 1.5v3M1.5 7h13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function WalletIcon({ size = 16, color = '#F97316' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="1.5" y="4.5" width="17" height="12" rx="2.5" stroke={color} strokeWidth="1.4" />
      <path d="M1.5 8.5h17" stroke={color} strokeWidth="1.4" />
      <circle cx="14.5" cy="12.5" r="1.5" fill={color} />
      <path d="M5 2.5c0-.83.67-1.5 1.5-1.5h7c.83 0 1.5.67 1.5 1.5V4.5H5V2.5z"
        stroke={color} strokeWidth="1.4" />
    </svg>
  )
}

export function PriceTagIcon({ color = '#94A3B8' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10.586 2H4a2 2 0 0 0-2 2v6.586a1 1 0 0 0 .293.707l7.414 7.414a2 2 0 0 0 2.828 0l5.172-5.172a2 2 0 0 0 0-2.828L10.586 2z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="6.5" cy="7.5" r="1.25" fill={color} />
    </svg>
  )
}

export function ClockIcon({ size = 16, color = '#94A3B8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.25" stroke={color} strokeWidth="1.3" />
      <path d="M8 5v3.5l2 1.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l1 9.5a1 1 0 0 0 1 .5h6a1 1 0 0 0 1-.5L13 4"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 12, color = '#94A3B8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2 4l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
