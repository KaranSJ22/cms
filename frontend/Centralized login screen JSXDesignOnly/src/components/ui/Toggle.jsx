import { T } from "../../constants/tokens.js"

export default function Toggle({ checked, onChange, id }) {
  return (
    <label htmlFor={id} style={{ display: "flex", alignItems: "center", cursor: "pointer",
      gap: "0.5rem", userSelect: "none" }}>
      <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ display: "none" }} />
      <div style={{ width: 40, height: 22, borderRadius: 11, position: "relative",
        backgroundColor: checked ? T.saffron : "rgba(255,255,255,0.12)",
        transition: "background-color 0.2s ease", flexShrink: 0,
        boxShadow: checked ? "0 0 8px rgba(255,153,51,0.4)" : "none" }}>
        <div style={{ position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: "50%",
          backgroundColor: "#fff", transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </div>
    </label>
  )
}
