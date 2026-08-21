import { T } from "../../constants/tokens.js"

export function PrimaryBtn({ children, type = "button", loading, onClick }) {
  return (
    <button type={type} disabled={loading} onClick={onClick}
      style={{ backgroundColor: loading ? "rgba(255,153,51,0.5)" : T.saffron, color: "#0F172A",
        fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.9rem",
        letterSpacing: "0.05em", border: "none", borderRadius: 8, padding: "0.8rem",
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading ? "none" : "0 4px 20px rgba(255,153,51,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        transition: "background-color 0.2s, transform 0.1s, box-shadow 0.2s" }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundColor = "#ffaa44"; e.currentTarget.style.transform = "translateY(-1px)" } }}
      onMouseLeave={e => { if (!loading) { e.currentTarget.style.backgroundColor = T.saffron; e.currentTarget.style.transform = "translateY(0)" } }}>
      {children}
    </button>
  )
}

export function GhostBtn({ children, loading, onClick }) {
  return (
    <button type="button" disabled={loading} onClick={onClick}
      style={{ width: "100%", backgroundColor: "transparent", color: loading ? T.silver : T.white,
        fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: "0.875rem",
        letterSpacing: "0.04em", border: `1px solid ${T.border}`, borderRadius: 8,
        padding: "0.75rem", cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        transition: "border-color 0.2s, background-color 0.2s, transform 0.1s" }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(-1px)" } }}
      onMouseLeave={e => { if (!loading) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.transform = "translateY(0)" } }}>
      {children}
    </button>
  )
}
