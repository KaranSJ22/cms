import { Spinner } from '../icons/Icons'

/** Primary Saffron CTA button — strictly utilitarian, high reliability */
export function PrimaryBtn({ children, onClick, type = 'button', loading = false, disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        flex items-center justify-center gap-1.5 w-full
        bg-orange-500 hover:bg-orange-600 active:bg-orange-700
        text-slate-950 font-bold text-xs md:text-sm font-grotesk tracking-wide
        rounded-md px-4 py-2 shadow-sm
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-offset-1
        ${className}
      `}
    >
      {loading ? <><Spinner color="#090d16" />{children}</> : children}
    </button>
  )
}

/** Ghost/outline button for secondary actions */
export function GhostBtn({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-1.5
        bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400
        text-slate-700 hover:text-slate-900
        font-semibold text-xs md:text-sm font-grotesk
        rounded-md px-3.5 py-2 shadow-xs
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-950
        ${className}
      `}
    >
      {children}
    </button>
  )
}

/** Dark ghost button for use on deep space blue bars */
export function NavGhostBtn({ children, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="
        flex items-center justify-center gap-1
        bg-slate-800/80 border border-slate-700 hover:border-slate-600
        text-slate-200 hover:text-white
        font-medium text-xs font-grotesk
        rounded-md px-2.5 py-1.5
        transition-colors duration-150
        focus:outline-none focus:ring-1 focus:ring-slate-500
      "
    >
      {children}
    </button>
  )
}

/** Small danger-red action button */
export function DangerBtn({ children, onClick, disabled = false, loading = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold font-grotesk
        bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-red-500
        ${className}
      `}
    >
      {loading ? <Spinner color="#ffffff" /> : null}
      {children}
    </button>
  )
}

/** Small green action button */
export function SuccessBtn({ children, onClick, disabled = false, loading = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold font-grotesk
        bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-emerald-500
        ${className}
      `}
    >
      {loading ? <Spinner color="#ffffff" /> : null}
      {children}
    </button>
  )
}
