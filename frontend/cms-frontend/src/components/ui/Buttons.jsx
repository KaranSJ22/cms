import { Spinner } from '../icons/Icons'

/** Primary saffron CTA button */
export function PrimaryBtn({ children, onClick, type = 'button', loading = false, disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        flex items-center justify-center gap-1.5 w-full
        bg-orange-500 hover:bg-orange-400 active:bg-orange-600
        text-slate-900 font-bold text-sm font-grotesk
        rounded-lg px-4 py-2.5
        shadow-[0_3px_14px_rgba(249,115,22,0.3)]
        hover:-translate-y-px active:translate-y-0
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
        ${className}
      `}
    >
      {loading ? <><Spinner />{children}</> : children}
    </button>
  )
}

/** Ghost/outline button */
export function GhostBtn({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-1.5
        bg-transparent border border-slate-200 hover:border-slate-300
        text-slate-500 hover:text-slate-900
        font-semibold text-sm font-grotesk
        rounded-lg px-4 py-2.5
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  )
}

/** Dark ghost button for use on the navy nav bar */
export function NavGhostBtn({ children, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="
        flex items-center justify-center gap-1
        bg-transparent border border-white/10 hover:border-white/30
        text-white/55 hover:text-white
        font-semibold text-xs font-grotesk
        rounded px-3 py-1.5
        transition-all duration-150
      "
    >
      {children}
    </button>
  )
}

/** Small danger-red action button */
export function DangerBtn({ children, onClick, disabled = false, loading = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="
        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold font-grotesk
        bg-red-500/20 hover:bg-red-500/30 text-red-400
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {loading ? <Spinner color="#f87171" /> : null}
      {children}
    </button>
  )
}

/** Small green action button */
export function SuccessBtn({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold font-grotesk
        bg-green-500/15 hover:bg-green-500/28 text-green-400
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {children}
    </button>
  )
}
