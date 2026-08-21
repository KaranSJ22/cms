import { T } from "../../constants/tokens.js"

export function FormField({ id, label, type, value, onChange, placeholder, autoComplete, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label htmlFor={id} style={{ fontFamily: "'Space Grotesk',sans-serif",
        fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em",
        color: T.saffron, textTransform: "uppercase" }}>{label}</label>
      <input id={id} type={type} value={value} required={required}
        autoComplete={autoComplete} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "0.7rem 1rem", color: T.white, fontSize: "0.9rem",
          outline: "none", fontFamily: "'Inter',sans-serif", transition: "border-color 0.2s, box-shadow 0.2s" }}
        onFocus={e => { e.target.style.borderColor = T.saffron; e.target.style.boxShadow = `0 0 0 3px ${T.saffronDim}` }}
        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none" }} />
    </div>
  )
}

export function WalletField({ label, children, error, hint, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.67rem",
        fontWeight: 600, letterSpacing: "0.1em", color: T.saffron, textTransform: "uppercase",
        display: "flex", gap: "0.3rem", alignItems: "center" }}>
        {label}
        {required && <span style={{ color: "#f87171", fontSize: "0.65rem" }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{error}</span>}
      {!error && hint && <span style={{ fontSize: "0.68rem", color: T.muted }}>{hint}</span>}
    </div>
  )
}

export function walletInputStyle(hasError) {
  return {
    width: "100%", backgroundColor: T.surface,
    border: `1px solid ${hasError ? "#f87171" : T.border}`,
    borderRadius: 7, padding: "0.6rem 0.75rem", color: T.white,
    fontSize: "0.82rem", outline: "none", fontFamily: "'Inter',sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  }
}

export function focusStyle(el, hasError) {
  el.style.borderColor = hasError ? "#f87171" : T.saffron
  el.style.boxShadow = `0 0 0 3px ${hasError ? "rgba(248,113,113,0.12)" : "rgba(255,153,51,0.12)"}`
}

export function blurStyle(el, hasError) {
  el.style.borderColor = hasError ? "#f87171" : T.border
  el.style.boxShadow = "none"
}

export function PanelField({ label, children, hint, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {hint && <span style={{ fontSize: "0.7rem", color: T.muted }}>{hint}</span>}
    </div>
  )
}

export function PanelInput({ value, onChange, placeholder, required, maxLength }) {
  return (
    <input type="text" value={value} required={required} maxLength={maxLength}
      placeholder={placeholder} onChange={e => onChange(e.target.value)}
      style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 7, padding: "0.55rem 0.75rem", color: T.white,
        fontSize: "0.82rem", outline: "none", fontFamily: "'Inter',sans-serif",
        transition: "border-color 0.2s, box-shadow 0.2s" }}
      onFocus={e => { e.target.style.borderColor = T.saffron; e.target.style.boxShadow = "0 0 0 3px rgba(255,153,51,0.12)" }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none" }} />
  )
}

export function FieldLabel({ children, required }) {
  return (
    <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.68rem",
      fontWeight: 600, letterSpacing: "0.1em", color: T.saffron,
      textTransform: "uppercase", display: "flex", gap: "0.3rem", alignItems: "center" }}>
      {children}
      {required && <span style={{ color: "#f87171", fontSize: "0.65rem" }}>*</span>}
    </label>
  )
}

export function ErrMsg({ children }) {
  return <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{children}</span>
}

export function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
      <div style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
      <span style={{ fontSize: "0.7rem", color: T.silver, letterSpacing: "0.1em",
        textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
    </div>
  )
}

export function PreviewItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: T.muted, textTransform: "uppercase",
        letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: "0.78rem", color: T.white, fontWeight: 600 }}>{value}</div>
    </div>
  )
}
