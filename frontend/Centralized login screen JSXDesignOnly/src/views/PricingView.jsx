import { useState } from "react"
import { T } from "../constants/tokens.js"
import { CUSTOMER_TYPES, blankPrices } from "../constants/data.js"
import { PlusIcon, CloseIcon, CalendarIcon, PriceTagIcon, TrashIcon } from "../components/icons/Icons.jsx"
import { FieldLabel, ErrMsg } from "../components/ui/FormComponents.jsx"
import { Spinner } from "../components/icons/Icons.jsx"

function formatDate(iso) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${d} ${months[+m - 1]} ${y}`
}

function PriceConfigCard({ config, onDelete }) {
  return (
    <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "0.85rem 1.1rem", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backgroundColor: T.surface }}>
        <div>
          <span style={{ fontFamily: "monospace", fontSize: "0.78rem",
            color: T.saffron, letterSpacing: "0.06em" }}>{config.menuCode}</span>
          <span style={{ fontSize: "0.82rem", color: T.white, marginLeft: "0.6rem",
            fontWeight: 500 }}>{config.itemName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem",
            fontSize: "0.72rem", color: T.silver }}>
            <CalendarIcon size={13} />
            <span>From <strong style={{ color: T.white }}>{formatDate(config.effFrom)}</strong></span>
          </div>
          <button onClick={() => onDelete(config.id)}
            style={{ background: "transparent", border: "none", cursor: "pointer",
              color: T.silver, padding: "0.2rem", borderRadius: 4, display: "flex",
              transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = T.silver)}>
            <TrashIcon />
          </button>
        </div>
      </div>
      <div style={{ padding: "0.75rem 1.1rem", display: "flex", flexDirection: "column", gap: "0" }}>
        {config.prices.map((row, i) => {
          const ct = CUSTOMER_TYPES.find(c => c.code === row.custType)
          return (
            <div key={row.custType}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.5rem 0",
                borderBottom: i < config.prices.length - 1 ? `1px solid rgba(0,0,0,0.04)` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: ct.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.78rem", color: T.silver }}>{ct.label}</span>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: "0.88rem",
                fontWeight: 600, color: T.white }}>
                ₹ {row.price || "—"}
              </span>
            </div>
          )
        })}
      </div>
      <div style={{ padding: "0.45rem 1.1rem", borderTop: `1px solid ${T.border}`,
        fontSize: "0.65rem", color: T.muted }}>
        Saved {config.savedAt}
      </div>
    </div>
  )
}

function PricingPanel({ menuItems, onClose, onSave }) {
  const [selectedMenu, setSelectedMenu] = useState(menuItems[0]?.menuCode ?? "")
  const [effFrom, setEffFrom] = useState("")
  const [prices, setPrices] = useState(blankPrices())
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const updatePrice = (custType, val) => {
    if (!/^\d*\.?\d*$/.test(val)) return
    setPrices(prev => prev.map(r => r.custType === custType ? { ...r, price: val } : r))
    setErrors(e => ({ ...e, [custType]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (!selectedMenu) errs.menu = "Select a menu item"
    if (!effFrom) errs.effFrom = "Effective date is required"
    const anyPrice = prices.some(r => r.price.trim() !== "")
    if (!anyPrice) errs.prices = "Enter at least one price"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      const item = menuItems.find(m => m.menuCode === selectedMenu)
      onSave({
        id: Date.now(),
        menuCode: selectedMenu,
        itemName: item.itemName,
        effFrom,
        prices: prices.filter(r => r.price.trim() !== ""),
        savedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      })
      setSaving(false)
    }, 600)
  }

  const filled = prices.filter(r => r.price !== "").length

  return (
    <div style={{ width: 460, backgroundColor: T.panel, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", height: "100vh",
      fontFamily: "'Inter', sans-serif", animation: "slideIn 0.25s ease-out" }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6) sepia(1) saturate(3) hue-rotate(10deg); cursor: pointer; }
        .price-input::placeholder { color: rgba(176,190,197,0.35); }
      `}</style>

      {/* Header */}
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: T.saffronDim,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PriceTagIcon color={T.saffron} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1rem",
            fontWeight: 700, margin: 0, color: T.white }}>Create Item Price</h2>
          <p style={{ fontSize: "0.72rem", color: T.silver, margin: "0.2rem 0 0" }}>
            Set effective pricing by customer type
          </p>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none",
          color: T.silver, cursor: "pointer", borderRadius: 6, display: "flex",
          padding: "0.2rem", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = T.white)}
          onMouseLeave={e => (e.currentTarget.style.color = T.silver)}>
          <CloseIcon />
        </button>
      </div>

      {/* Form body */}
      <form onSubmit={handleSave} style={{ flex: 1, overflowY: "auto",
        padding: "1.4rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Menu item selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <FieldLabel required>MENU ITEM</FieldLabel>
          <select value={selectedMenu} onChange={e => { setSelectedMenu(e.target.value); setErrors(er => ({ ...er, menu: undefined })) }}
            style={{ backgroundColor: T.surface, border: `1px solid ${errors.menu ? "#f87171" : T.border}`,
              borderRadius: 7, padding: "0.6rem 0.85rem", color: T.white,
              fontSize: "0.82rem", outline: "none", fontFamily: "'Inter',sans-serif",
              transition: "border-color 0.2s", appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23b0bec5' viewBox='0 0 16 16'%3E%3Cpath d='M8 10.5l-4-4h8z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center" }}
            onFocus={e => e.target.style.borderColor = T.saffron}
            onBlur={e => e.target.style.borderColor = errors.menu ? "#f87171" : T.border}>
            {menuItems.map(m => (
              <option key={m.menuCode} value={m.menuCode} style={{ backgroundColor: T.surface }}>
                {m.menuCode} — {m.itemName}
              </option>
            ))}
          </select>
          {errors.menu && <ErrMsg>{errors.menu}</ErrMsg>}
        </div>

        {/* EFFFROM date picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <FieldLabel required>EFFFROM</FieldLabel>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "0.75rem", top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none" }}>
              <CalendarIcon size={15} color={T.silver} />
            </div>
            <input type="date" value={effFrom}
              onChange={e => { setEffFrom(e.target.value); setErrors(er => ({ ...er, effFrom: undefined })) }}
              min={new Date().toISOString().split("T")[0]}
              style={{ width: "100%", backgroundColor: T.surface,
                border: `1px solid ${errors.effFrom ? "#f87171" : T.border}`,
                borderRadius: 7, padding: "0.6rem 0.85rem 0.6rem 2.4rem",
                color: T.white, fontSize: "0.82rem", outline: "none",
                fontFamily: "'Inter',sans-serif", colorScheme: "dark",
                transition: "border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.target.style.borderColor = T.saffron; e.target.style.boxShadow = "0 0 0 3px rgba(255,153,51,0.12)" }}
              onBlur={e => { e.target.style.borderColor = errors.effFrom ? "#f87171" : T.border; e.target.style.boxShadow = "none" }} />
          </div>
          {errors.effFrom && <ErrMsg>{errors.effFrom}</ErrMsg>}
          <span style={{ fontSize: "0.7rem", color: T.muted }}>Pricing applies from this date onwards</span>
        </div>

        {/* Price grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <FieldLabel required>PRICE BY CUSTOMER TYPE</FieldLabel>
            <span style={{ fontSize: "0.68rem", color: T.muted }}>{filled}/4 set</span>
          </div>
          {errors.prices && <ErrMsg>{errors.prices}</ErrMsg>}

          <div style={{ backgroundColor: T.surface, border: `1px solid ${errors.prices ? "#f87171" : T.border}`,
            borderRadius: 9, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px",
              backgroundColor: "rgba(0,0,0,0.03)",
              borderBottom: `1px solid ${T.border}`, padding: "0.45rem 1rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em",
                color: T.silver, textTransform: "uppercase",
                fontFamily: "'Space Grotesk',sans-serif" }}>Customer Type</span>
              <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em",
                color: T.silver, textTransform: "uppercase", textAlign: "right",
                fontFamily: "'Space Grotesk',sans-serif" }}>Price (₹)</span>
            </div>

            {CUSTOMER_TYPES.map((ct, i) => {
              const row = prices.find(r => r.custType === ct.code)
              const isLast = i === CUSTOMER_TYPES.length - 1
              return (
                <div key={ct.code}
                  style={{ display: "grid", gridTemplateColumns: "1fr 140px",
                    alignItems: "center", padding: "0.65rem 1rem",
                    borderBottom: isLast ? "none" : `1px solid rgba(0,0,0,0.04)`,
                    transition: "background-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.025)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%",
                        backgroundColor: ct.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600,
                        color: T.white, fontFamily: "'Space Grotesk',sans-serif",
                        letterSpacing: "0.03em" }}>{ct.code}</span>
                    </div>
                    <span style={{ fontSize: "0.7rem", color: T.muted,
                      paddingLeft: "1.25rem" }}>{ct.desc}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "0.82rem", color: T.silver, flexShrink: 0 }}>₹</span>
                    <input
                      className="price-input"
                      type="text"
                      inputMode="decimal"
                      value={row.price}
                      onChange={e => updatePrice(ct.code, e.target.value)}
                      placeholder="0.00"
                      style={{ width: 90, backgroundColor: "rgba(0,0,0,0.04)",
                        border: `1px solid ${T.border}`, borderRadius: 6,
                        padding: "0.45rem 0.6rem", color: T.white,
                        fontSize: "0.88rem", fontFamily: "monospace",
                        textAlign: "right", outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s" }}
                      onFocus={e => { e.target.style.borderColor = ct.color; e.target.style.boxShadow = `0 0 0 3px ${ct.color}22` }}
                      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none" }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary bar */}
          {filled > 0 && (
            <div style={{ backgroundColor: T.saffronDim, border: "1px solid rgba(255,153,51,0.2)",
              borderRadius: 7, padding: "0.55rem 0.85rem",
              display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: T.saffron }}>
                {filled} customer type{filled > 1 ? "s" : ""} priced
              </span>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {prices.filter(r => r.price).map(r => {
                  const ct = CUSTOMER_TYPES.find(c => c.code === r.custType)
                  return (
                    <span key={r.custType} style={{ fontSize: "0.72rem",
                      color: ct.color, fontFamily: "monospace" }}>
                      {r.custType.slice(0, 4)} ₹{r.price}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Footer */}
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
        <button disabled={saving} onClick={handleSave}
          style={{ flex: 2, backgroundColor: saving ? "rgba(255,153,51,0.5)" : T.saffron,
            border: "none", borderRadius: 7, color: "#0F172A",
            fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
            padding: "0.65rem", cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            boxShadow: saving ? "none" : "0 2px 12px rgba(255,153,51,0.25)",
            transition: "background-color 0.2s" }}>
          {saving ? <><Spinner />Saving…</> : "Save Price Config"}
        </button>
      </div>
    </div>
  )
}

export default function PricingView({ menuItems, configs, setConfigs }) {
  const [panelOpen, setPanelOpen] = useState(false)

  const activeItems = menuItems.filter(m => m.status === "A")

  return (
    <div style={{ flex: 1, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.1rem",
            fontWeight: 700, margin: 0, color: T.white }}>Pricing Configuration</h2>
          <p style={{ fontSize: "0.78rem", color: T.silver, margin: "0.25rem 0 0" }}>
            Set customer-type prices per menu item with effective dates
          </p>
        </div>
        <button onClick={() => setPanelOpen(true)}
          style={{ backgroundColor: T.saffron, color: "#0F172A", fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700, fontSize: "0.8rem", border: "none", borderRadius: 7,
            padding: "0.55rem 1.1rem", cursor: "pointer",
            boxShadow: "0 2px 12px rgba(255,153,51,0.3)",
            display: "flex", alignItems: "center", gap: "0.4rem", transition: "background-color 0.2s,transform 0.1s" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#ffaa44"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.saffron; e.currentTarget.style.transform = "translateY(0)" }}>
          <PlusIcon /> Add Price Config
        </button>
      </div>

      {/* Empty state */}
      {configs.length === 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: "1rem", padding: "4rem",
          backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%",
            backgroundColor: T.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PriceTagIcon />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: T.white, fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>No price configurations yet</p>
            <p style={{ color: T.silver, fontSize: "0.78rem", marginTop: "0.3rem" }}>
              Click "Add Price Config" to set prices for a menu item
            </p>
          </div>
          <button onClick={() => setPanelOpen(true)}
            style={{ backgroundColor: T.saffronDim, color: T.saffron, border: `1px solid rgba(255,153,51,0.3)`,
              borderRadius: 7, padding: "0.5rem 1.2rem", fontSize: "0.82rem", fontWeight: 600,
              fontFamily: "'Space Grotesk',sans-serif", cursor: "pointer" }}>
            + Add Price Config
          </button>
        </div>
      )}

      {/* Config cards grid */}
      {configs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(420px,1fr))", gap: "1rem" }}>
          {configs.map(cfg => (
            <PriceConfigCard key={cfg.id} config={cfg}
              onDelete={id => setConfigs(prev => prev.filter(c => c.id !== id))} />
          ))}
        </div>
      )}

      {/* Slide-out panel */}
      {panelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}
          onClick={e => { if (e.target === e.currentTarget) setPanelOpen(false) }}>
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
          <PricingPanel
            menuItems={activeItems}
            onClose={() => setPanelOpen(false)}
            onSave={cfg => { setConfigs(prev => [cfg, ...prev]); setPanelOpen(false) }}
          />
        </div>
      )}
    </div>
  )
}
