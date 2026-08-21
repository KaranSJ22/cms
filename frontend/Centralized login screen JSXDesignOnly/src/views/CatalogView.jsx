import { useState } from "react"
import { T } from "../constants/tokens.js"
import { STATUS_META, CUSTOMER_TYPES } from "../constants/data.js"
import { SearchIcon, PlusIcon, CloseIcon } from "../components/icons/Icons.jsx"
import { TableRow } from "../components/ui/Cell.jsx"
import { FieldLabel, ErrMsg, PanelField, PanelInput } from "../components/ui/FormComponents.jsx"
import { Spinner } from "../components/icons/Icons.jsx"

function CreateMenuPanel({ onClose, onCreate }) {
  const [form, setForm] = useState({ menuCode: "", shortName: "", itemName: "",
    itemDescr: "", isSpecial: false, status: "A" })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault(); setSaving(true)
    setTimeout(() => { onCreate({ menuCode: form.menuCode, shortName: form.shortName,
      itemName: form.itemName, status: form.status }); setSaving(false) }, 600)
  }

  return (
    <div style={{ width: 400, backgroundColor: T.panel, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", height: "100vh",
      animation: "slideIn 0.25s ease-out", fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} ::placeholder{color:rgba(176,190,197,0.4)!important}`}</style>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1rem",
            fontWeight: 700, margin: 0, color: T.white }}>Create Menu Item</h2>
          <p style={{ fontSize: "0.72rem", color: T.silver, margin: "0.2rem 0 0" }}>Add a new item to the catalog</p>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none",
          color: T.silver, cursor: "pointer", padding: "0.25rem", borderRadius: 6, display: "flex",
          transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = T.white)}
          onMouseLeave={e => (e.currentTarget.style.color = T.silver)}>
          <CloseIcon />
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto",
        padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <PanelField label="MENUCODE" required hint="Unique menu identifier, e.g. MNU013">
          <PanelInput value={form.menuCode} onChange={v => set("menuCode", v)} placeholder="MNU013" required />
        </PanelField>
        <PanelField label="SHORTNAME" required hint="Abbreviated display code (max 12 chars)">
          <PanelInput value={form.shortName} onChange={v => set("shortName", v)} placeholder="VEG-THALI" maxLength={12} required />
        </PanelField>
        <PanelField label="ITEMNAME" required>
          <PanelInput value={form.itemName} onChange={v => set("itemName", v)} placeholder="Full display name" required />
        </PanelField>
        <PanelField label="ITEMDESCR">
          <textarea value={form.itemDescr} onChange={e => set("itemDescr", e.target.value)}
            placeholder="Optional description…" rows={3}
            style={{ width: "100%", backgroundColor: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 7, padding: "0.55rem 0.75rem", color: T.white, fontSize: "0.82rem",
              outline: "none", resize: "vertical", fontFamily: "'Inter',sans-serif",
              transition: "border-color 0.2s", lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = T.saffron}
            onBlur={e => e.target.style.borderColor = T.border} />
        </PanelField>
        <PanelField label="STATUS">
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {Object.keys(STATUS_META).map(s => {
              const sel = form.status === s
              const meta = STATUS_META[s]
              return (
                <button key={s} type="button" onClick={() => set("status", s)}
                  style={{ padding: "0.3rem 0.7rem", borderRadius: 20, fontSize: "0.72rem",
                    fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                    backgroundColor: sel ? meta.colors.bg : "transparent",
                    color: sel ? meta.colors.text : T.silver,
                    borderColor: sel ? meta.colors.border : T.border }}>{s}</button>
              )
            })}
          </div>
        </PanelField>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer",
          padding: "0.85rem 1rem",
          backgroundColor: form.isSpecial ? "rgba(255,153,51,0.07)" : T.surface,
          border: `1px solid ${form.isSpecial ? "rgba(255,153,51,0.3)" : T.border}`,
          borderRadius: 8, transition: "all 0.2s" }}>
          <div style={{ position: "relative", marginTop: "0.05rem", flexShrink: 0 }}>
            <input type="checkbox" checked={form.isSpecial} onChange={e => set("isSpecial", e.target.checked)}
              style={{ position: "absolute", opacity: 0, width: 18, height: 18, margin: 0, cursor: "pointer", zIndex: 1 }} />
            <div style={{ width: 18, height: 18, borderRadius: 4,
              border: `2px solid ${form.isSpecial ? T.saffron : T.border}`,
              backgroundColor: form.isSpecial ? T.saffron : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              {form.isSpecial && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#0b1e3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em",
              color: T.saffron, fontFamily: "'Space Grotesk',sans-serif",
              textTransform: "uppercase", marginBottom: "0.2rem" }}>ISSPECIAL</div>
            <div style={{ fontSize: "0.77rem", color: T.silver, lineHeight: 1.4 }}>
              Mark as a special/featured item
            </div>
          </div>
        </label>
      </form>
      <div style={{ padding: "1rem 1.5rem", borderTop: `1px solid ${T.border}`,
        display: "flex", gap: "0.75rem" }}>
        <button type="button" onClick={onClose}
          style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${T.border}`,
            borderRadius: 7, color: T.silver, fontSize: "0.85rem", fontWeight: 600,
            fontFamily: "'Space Grotesk',sans-serif", padding: "0.65rem", cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.white }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.silver }}>
          Cancel
        </button>
        <button type="submit" onClick={e => { e.preventDefault(); handleSubmit(e) }}
          disabled={saving}
          style={{ flex: 2, backgroundColor: saving ? "rgba(255,153,51,0.5)" : T.saffron,
            border: "none", borderRadius: 7, color: "#0F172A", fontSize: "0.85rem", fontWeight: 700,
            fontFamily: "'Space Grotesk',sans-serif", padding: "0.65rem",
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            boxShadow: saving ? "none" : "0 2px 12px rgba(255,153,51,0.25)",
            transition: "background-color 0.2s" }}>
          {saving ? <><Spinner />Saving…</> : "Save Item"}
        </button>
      </div>
    </div>
  )
}

export default function CatalogView({ items, setItems }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [search, setSearch] = useState("")

  const filtered = items.filter(it => {
    const matchStatus = filterStatus === "ALL" || it.status === filterStatus
    const q = search.toLowerCase()
    return matchStatus && (!q || it.menuCode.toLowerCase().includes(q) ||
      it.shortName.toLowerCase().includes(q) || it.itemName.toLowerCase().includes(q))
  })

  const handleCreate = (item) => {
    setItems(prev => [{ ...item, id: prev.length + 1 }, ...prev])
    setPanelOpen(false)
  }

  return (
    <div style={{ flex: 1, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <SearchIcon />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code, name…"
            style={{ width: "100%", backgroundColor: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 7, padding: "0.5rem 0.75rem 0.5rem 2.25rem", color: T.white,
              fontSize: "0.8rem", outline: "none", fontFamily: "'Inter', sans-serif", transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = T.saffron}
            onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["ALL","A","D","P","EXP","BLK"]).map(s => {
            const active = filterStatus === s
            const meta = s !== "ALL" ? STATUS_META[s] : null
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: "0.3rem 0.65rem", borderRadius: 20, fontSize: "0.72rem",
                  fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                  backgroundColor: active ? (meta ? meta.colors.bg : T.saffronDim) : "transparent",
                  color: active ? (meta ? meta.colors.text : T.saffron) : T.silver,
                  borderColor: active ? (meta ? meta.colors.border : T.saffron) : T.border }}>
                {s === "ALL" ? "All" : s}
              </button>
            )
          })}
        </div>
        <button onClick={() => setPanelOpen(true)}
          style={{ backgroundColor: T.saffron, color: "#0F172A", fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700, fontSize: "0.8rem", border: "none", borderRadius: 7,
            padding: "0.5rem 1rem", cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: "0 2px 12px rgba(255,153,51,0.3)",
            display: "flex", alignItems: "center", gap: "0.4rem", transition: "background-color 0.2s,transform 0.1s" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#ffaa44"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.saffron; e.currentTarget.style.transform = "translateY(0)" }}>
          <PlusIcon /> Create Item
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {(["A","D","P","EXP","BLK"]).map(s => {
          const count = items.filter(i => i.status === s).length
          const meta = STATUS_META[s]
          return (
            <div key={s} style={{ backgroundColor: T.card, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "0.6rem 1rem", minWidth: 90 }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 700,
                fontFamily: "'Space Grotesk',sans-serif", color: meta.colors.text }}>{count}</div>
              <div style={{ fontSize: "0.65rem", color: T.silver, letterSpacing: "0.06em",
                textTransform: "uppercase" }}>{meta.label}</div>
            </div>
          )
        })}
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "0.6rem 1rem", minWidth: 90 }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 700,
            fontFamily: "'Space Grotesk',sans-serif", color: T.white }}>{items.length}</div>
          <div style={{ fontSize: "0.65rem", color: T.silver, letterSpacing: "0.06em",
            textTransform: "uppercase" }}>Total</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, backgroundColor: T.card, border: `1px solid ${T.border}`,
        borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "130px 180px 1fr 130px",
          backgroundColor: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 1.25rem" }}>
          {["Menu Code","Short Name","Item Name","Status"].map(col => (
            <div key={col} style={{ padding: "0.6rem 0", fontSize: "0.68rem", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase", color: T.silver,
              fontFamily: "'Space Grotesk',sans-serif" }}>{col}</div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0
            ? <div style={{ padding: "3rem", textAlign: "center", color: T.silver, fontSize: "0.85rem" }}>No items match.</div>
            : filtered.map((item, idx) => <TableRow key={item.id} item={item} odd={idx % 2 === 0} />)}
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "0.5rem 1.25rem",
          fontSize: "0.72rem", color: T.muted, display: "flex", justifyContent: "space-between" }}>
          <span>Showing {filtered.length} of {items.length} items</span>
          <span>Menu Catalog · ISRO CMS</span>
        </div>
      </div>

      {panelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}
          onClick={e => { if (e.target === e.currentTarget) setPanelOpen(false) }}>
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
          <CreateMenuPanel onClose={() => setPanelOpen(false)} onCreate={handleCreate} />
        </div>
      )}
    </div>
  )
}
