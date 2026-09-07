/** Generic form field label - high legibility uppercase */
export function FieldLabel({ children, required }) {
  return (
    <label className="flex items-center gap-1 font-grotesk text-[0.68rem] font-bold tracking-[0.08em] uppercase text-slate-700">
      {children}
      {required && <span className="text-red-500 text-[0.65rem] font-bold">*</span>}
    </label>
  )
}

/** Inline error message */
export function ErrMsg({ children }) {
  return <span className="text-[0.7rem] font-medium text-red-600 leading-tight">{children}</span>
}

/** Preview label+value pair used in DayMenu panel */
export function PreviewItem({ label, value }) {
  return (
    <div>
      <div className="text-[0.65rem] text-slate-500 uppercase tracking-[0.06em] font-medium">{label}</div>
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
      <label htmlFor={id} className="font-grotesk text-[0.68rem] font-bold tracking-[0.1em] uppercase text-slate-300">
        {label}
        {required && <span className="text-orange-400 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="
          bg-slate-950 border border-slate-700 rounded-md
          px-3.5 py-2 text-white text-[0.85rem] font-inter
          outline-none placeholder:text-slate-500
          focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30
          transition-colors duration-150 w-full
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
      <label className="flex items-center gap-1 font-grotesk text-[0.68rem] font-bold tracking-[0.08em] uppercase text-slate-700">
        {label}
        {required && <span className="text-red-500 text-[0.65rem]">*</span>}
      </label>
      {children}
      {error && <span className="text-[0.7rem] text-red-600 font-medium">{error}</span>}
      {!error && hint && <span className="text-[0.68rem] text-slate-500">{hint}</span>}
    </div>
  )
}

/**
 * Slide panel form field wrapper (dark surfaces)
 */
export function PanelField({ label, children, hint, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 font-grotesk text-[0.68rem] font-bold tracking-[0.08em] uppercase text-slate-300">
        {label}
        {required && <span className="text-orange-400 text-[0.65rem]">*</span>}
      </label>
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
      onChange={(e) => onChange(e.target.value)}
      className="
        bg-slate-900 border border-slate-700 rounded-md
        px-3 py-2 text-white text-[0.82rem]
        outline-none placeholder:text-slate-500
        focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20
        transition-colors duration-150 w-full
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
      onChange={(e) => onChange(e.target.value)}
      className={`
        bg-white border border-slate-300 rounded-md
        px-3 py-2 text-slate-900 text-[0.82rem]
        outline-none placeholder:text-slate-400
        focus:border-blue-950 focus:ring-1 focus:ring-blue-950
        transition-colors duration-150 w-full
        ${className}
      `}
    />
  )
}

/** Horizontal divider with optional label */
export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      {label && (
        <span className="text-[0.68rem] text-slate-500 font-bold tracking-[0.1em] uppercase whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

/**
 * Select field component
 */
export function SelectField({ id, label, value, onChange, options = [], children, required, className = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="font-grotesk text-[0.68rem] font-bold tracking-[0.08em] uppercase text-slate-700">
          {label}
          {required && <span className="text-red-500 text-[0.65rem] ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
        className={`
          bg-white border border-slate-300 rounded-md
          px-3 py-2 text-slate-900 text-[0.82rem] font-inter
          outline-none focus:border-blue-950 focus:ring-1 focus:ring-blue-950
          transition-colors duration-150 w-full cursor-pointer
          ${className}
        `}
      >
        {children ||
          options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-slate-900">
              {opt.label}
            </option>
          ))}
      </select>
    </div>
  )
}

/** Input styles for wallet forms */
export const walletInputBase =
  'w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-[0.82rem] outline-none placeholder:text-slate-500 transition-colors duration-150 font-inter focus:border-orange-500'
