/** Generic form field label - saffron uppercase */
export function FieldLabel({ children, required }) {
  return (
    <label className="flex items-center gap-1 font-grotesk text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-orange-500">
      {children}
      {required && <span className="text-red-400 text-[0.65rem]">*</span>}
    </label>
  )
}

/** Inline error message */
export function ErrMsg({ children }) {
  return <span className="text-[0.7rem] text-red-400">{children}</span>
}

/** Preview label+value pair used in DayMenu panel */
export function PreviewItem({ label, value }) {
  return (
    <div>
      <div className="text-[0.65rem] text-slate-400 uppercase tracking-[0.06em]">{label}</div>
      <div className="text-[0.78rem] text-slate-900 font-semibold">{value}</div>
    </div>
  )
}

/**
 * Login page form field (white-on-dark style)
 */
export function FormField({ id, label, type, value, onChange, placeholder, autoComplete, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-grotesk text-[0.7rem] font-semibold tracking-[0.12em] uppercase text-orange-500">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="
          bg-slate-800/60 border border-slate-700 rounded-lg
          px-4 py-2.5 text-white text-[0.9rem] font-inter
          outline-none
          placeholder:text-slate-500
          focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
          transition-all duration-200
        "
      />
    </div>
  )
}

/**
 * Wallet top-up form field wrapper
 */
export function WalletField({ label, children, error, hint, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 font-grotesk text-[0.67rem] font-semibold tracking-[0.1em] uppercase text-orange-500">
        {label}
        {required && <span className="text-red-400 text-[0.65rem]">*</span>}
      </label>
      {children}
      {error && <span className="text-[0.7rem] text-red-400">{error}</span>}
      {!error && hint && <span className="text-[0.68rem] text-slate-400">{hint}</span>}
    </div>
  )
}

/**
 * Slide panel form field wrapper (dark surfaces)
 */
export function PanelField({ label, children, hint, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {hint && <span className="text-[0.7rem] text-slate-400">{hint}</span>}
    </div>
  )
}

/**
 * Text input styled for dark slide panels
 */
export function PanelInput({ value, onChange, placeholder, required, maxLength, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      required={required}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="
        bg-slate-800 border border-slate-700 rounded-lg
        px-3 py-2 text-white text-[0.82rem]
        outline-none placeholder:text-slate-500
        focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10
        transition-all duration-200 w-full
      "
    />
  )
}

/**
 * Input styled for light/white form panels (Wallet, Bookings filter)
 */
export function LightInput({ value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`
        bg-white border border-slate-200 rounded-lg
        px-3 py-2 text-slate-900 text-[0.82rem]
        outline-none placeholder:text-slate-400
        focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10
        transition-all duration-200 w-full
        ${className}
      `}
    />
  )
}

/** Horizontal divider with optional label */
export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-black/6" />
      {label && (
        <span className="text-[0.7rem] text-slate-400 tracking-[0.1em] uppercase whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-black/6" />
    </div>
  )
}

/** Input styles for wallet forms (used with focus/blur handlers) */
export const walletInputBase =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-[0.82rem] outline-none placeholder:text-slate-500 transition-all duration-200 font-inter'
