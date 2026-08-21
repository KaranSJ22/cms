import { useState } from "react"
import { T } from "../../constants/tokens.js"
import { STATUS_META } from "../../constants/data.js"

export function Cell({ children, mono }) {
  return (
    <div style={{ padding: "0.65rem 0", fontSize: "0.82rem", color: T.white,
      display: "flex", alignItems: "center",
      fontFamily: mono ? "monospace" : "'Inter',sans-serif",
      letterSpacing: mono ? "0.04em" : undefined }}>
      {children}
    </div>
  )
}

export function TableRow({ item, odd }) {
  const [hov, setHov] = useState(false)
  const meta = STATUS_META[item.status]
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "grid", gridTemplateColumns: "130px 180px 1fr 130px",
        padding: "0 1.25rem",
        backgroundColor: hov ? T.surface : odd ? "rgba(0,0,0,0.018)" : "transparent",
        borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background-color 0.15s" }}>
      <Cell mono>{item.menuCode}</Cell>
      <Cell>{item.shortName}</Cell>
      <Cell>{item.itemName}</Cell>
      <Cell>
        <span style={{ padding: "0.2rem 0.6rem", borderRadius: 20, fontSize: "0.68rem",
          fontWeight: 600, letterSpacing: "0.04em", fontFamily: "'Space Grotesk',sans-serif",
          backgroundColor: meta.colors.bg, color: meta.colors.text, border: `1px solid ${meta.colors.border}` }}>
          {meta.label}
        </span>
      </Cell>
    </div>
  )
}
