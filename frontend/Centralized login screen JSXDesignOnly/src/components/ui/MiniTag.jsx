import { T } from "../../constants/tokens.js"

export default function MiniTag({ active, label }) {
  return (
    <span style={{ padding: "0.1rem 0.45rem", borderRadius: 4, fontSize: "0.62rem",
      fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'Space Grotesk',sans-serif",
      backgroundColor: active ? "rgba(30,58,138,0.08)" : T.surface,
      color: active ? "#1e3a8a" : T.muted,
      border: `1px solid ${active ? "rgba(30,58,138,0.22)" : T.border}` }}>
      {active ? label : "OFF"}
    </span>
  )
}
