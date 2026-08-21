import { useState } from "react"
import { T } from "../constants/tokens.js"
import { DAY_SLOTS, SEED_DAY_MENUS } from "../constants/data.js"
import { PlusIcon, CloseIcon, CalendarIcon, ClockIcon } from "../components/icons/Icons.jsx"
import { FieldLabel, ErrMsg, PreviewItem } from "../components/ui/FormComponents.jsx"
import MiniTag from "../components/ui/MiniTag.jsx"
import Toggle from "../components/ui/Toggle.jsx"
import { Spinner } from "../components/icons/Icons.jsx"

function formatDate(iso) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${d} ${months[+m - 1]} ${y}`
}

function DayMenuPanel({ menuItems, onClose, onSave }) {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({
    daySlot: "LUNCH",
    menuCode: menuItems[0]?.menuCode ?? "",
    availQty: "",
    maxQty: "",
    bookUntilDate: today,
    bookUntilTime: "11:30",
    cancelUntilDate: today,
    cancelUntilTime: "11:00",
    isPrebook: true,
    isKiosk: false,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: "" }))
  }

  const validate = () => {
    const errs = {}
    if (!form.menuCode) errs.menuCode = "Required"
    if (!form.availQty || isNaN(+form.availQty)) errs.availQty = "Enter a valid number"
    if (!form.maxQty   || isNaN(+form.maxQty))   errs.maxQty   = "Enter a valid number"
    if (+form.availQty > +form.maxQty) errs.availQty = "Cannot exceed Max Qty"
    if (!form.bookUntilDate)   errs.bookUntilDate   = "Required"
    if (!form.cancelUntilDate) errs.cancelUntilDate = "Required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const item = menuItems.find(m => m.menuCode === form.menuCode)
    setTimeout(() => {
      onSave({ ...form, itemName: item.itemName })
      setSaving(false)
    }, 600)
  }

  const selectedSlot = DAY_SLOTS.find(s => s.code === form.daySlot)

  return (
    <div style={{ width: 480, backgroundColor: T.panel, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", height: "100vh",
      fontFamily: "'Inter', sans-serif", animation: "slideIn 0.25s ease-out" }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Header */}
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          backgroundColor: T.saffronDim, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem" }}>📅</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1rem",
            fontWeight: 700, margin: 0, color: T.white }}>Schedule Day Menu</h2>
          <p style={{ fontSize: "0.72rem", color: T.silver, margin: "0.2rem 0 0" }}>
            Configure a menu slot for canteen service
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

      <form onSubmit={handleSave} style={{ flex: 1, overflowY: "auto",
        padding: "1.4rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>

        {/* Day Slot selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <FieldLabel required>DAY SLOT</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.4rem" }}>
            {DAY_SLOTS.map(slot => {
              const sel = form.daySlot === slot.code
              return (
                <button key={slot.code} type="button" onClick={() => set("daySlot", slot.code)}
                  style={{ padding: "0.6rem 0.4rem", borderRadius: 8, border: "1px solid",
                    cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                    backgroundColor: sel ? `${slot.color}1a` : "transparent",
                    borderColor: sel ? `${slot.color}55` : T.border }}>
                  <div style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>{slot.icon}</div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: sel ? slot.color : T.silver,
                    fontFamily: "'Space Grotesk',sans-serif" }}>{slot.label}</div>
                  <div style={{ fontSize: "0.6rem", color: T.muted, marginTop: "0.1rem" }}>{slot.time}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Menu Item */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <FieldLabel required>MENU ITEM</FieldLabel>
          <select value={form.menuCode} onChange={e => set("menuCode", e.target.value)}
            style={{ backgroundColor: T.surface, border: `1px solid ${errors.menuCode ? "#f87171" : T.border}`,
              borderRadius: 7, padding: "0.6rem 0.85rem", color: T.white,
              fontSize: "0.82rem", outline: "none", fontFamily: "'Inter',sans-serif",
              appearance: "none", colorScheme: "dark",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23b0bec5' viewBox='0 0 16 16'%3E%3Cpath d='M8 10.5l-4-4h8z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center",
              transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = T.saffron}
            onBlur={e => e.target.style.borderColor = errors.menuCode ? "#f87171" : T.border}>
            {menuItems.map(m => (
              <option key={m.menuCode} value={m.menuCode} style={{ backgroundColor: T.surface }}>
                {m.menuCode} — {m.itemName}
              </option>
            ))}
          </select>
        </div>

        {/* Qty row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[["availQty","AVAILQTY","e.g. 80"],["maxQty","MAXQTY","e.g. 100"]].map(([key,lbl,ph]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <FieldLabel required>{lbl}</FieldLabel>
              <input type="text" inputMode="numeric" value={form[key]}
                onChange={e => set(key, e.target.value)} placeholder={ph}
                style={{ backgroundColor: T.surface,
                  border: `1px solid ${errors[key] ? "#f87171" : T.border}`,
                  borderRadius: 7, padding: "0.6rem 0.75rem", color: T.white,
                  fontSize: "0.82rem", outline: "none", fontFamily: "'Inter',sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s" }}
                onFocus={e => { e.target.style.borderColor = T.saffron; e.target.style.boxShadow = "0 0 0 3px rgba(255,153,51,0.12)" }}
                onBlur={e => { e.target.style.borderColor = errors[key] ? "#f87171" : T.border; e.target.style.boxShadow = "none" }} />
              {errors[key] && <ErrMsg>{errors[key]}</ErrMsg>}
            </div>
          ))}
        </div>

        {/* Book Until */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <FieldLabel required>BOOK UNTIL</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: "0.5rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "0.7rem", top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none" }}>
                <CalendarIcon size={14} color={T.silver} />
              </div>
              <input type="date" value={form.bookUntilDate}
                onChange={e => set("bookUntilDate", e.target.value)}
                style={{ width: "100%", backgroundColor: T.surface,
                  border: `1px solid ${errors.bookUntilDate ? "#f87171" : T.border}`,
                  borderRadius: 7, padding: "0.6rem 0.75rem 0.6rem 2.2rem",
                  color: T.white, fontSize: "0.82rem", outline: "none",
                  fontFamily: "'Inter',sans-serif", colorScheme: "dark",
                  transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = T.saffron}
                onBlur={e => e.target.style.borderColor = errors.bookUntilDate ? "#f87171" : T.border} />
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "0.7rem", top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none" }}>
                <ClockIcon size={14} color={T.silver} />
              </div>
              <input type="time" value={form.bookUntilTime}
                onChange={e => set("bookUntilTime", e.target.value)}
                style={{ width: "100%", backgroundColor: T.surface,
                  border: `1px solid ${T.border}`, borderRadius: 7,
                  padding: "0.6rem 0.5rem 0.6rem 2.2rem",
                  color: T.white, fontSize: "0.82rem", outline: "none",
                  fontFamily: "'Inter',sans-serif", colorScheme: "dark",
                  transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = T.saffron}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>
          </div>
          {errors.bookUntilDate && <ErrMsg>{errors.bookUntilDate}</ErrMsg>}
          <span style={{ fontSize: "0.7rem", color: T.muted }}>Bookings close at this date & time</span>
        </div>

        {/* Cancel Until */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <FieldLabel required>CANCEL UNTIL</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: "0.5rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "0.7rem", top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none" }}>
                <CalendarIcon size={14} color={T.silver} />
              </div>
              <input type="date" value={form.cancelUntilDate}
                onChange={e => set("cancelUntilDate", e.target.value)}
                style={{ width: "100%", backgroundColor: T.surface,
                  border: `1px solid ${errors.cancelUntilDate ? "#f87171" : T.border}`,
                  borderRadius: 7, padding: "0.6rem 0.75rem 0.6rem 2.2rem",
                  color: T.white, fontSize: "0.82rem", outline: "none",
                  fontFamily: "'Inter',sans-serif", colorScheme: "dark",
                  transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = T.saffron}
                onBlur={e => e.target.style.borderColor = errors.cancelUntilDate ? "#f87171" : T.border} />
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "0.7rem", top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none" }}>
                <ClockIcon size={14} color={T.silver} />
              </div>
              <input type="time" value={form.cancelUntilTime}
                onChange={e => set("cancelUntilTime", e.target.value)}
                style={{ width: "100%", backgroundColor: T.surface,
                  border: `1px solid ${T.border}`, borderRadius: 7,
                  padding: "0.6rem 0.5rem 0.6rem 2.2rem",
                  color: T.white, fontSize: "0.82rem", outline: "none",
                  fontFamily: "'Inter',sans-serif", colorScheme: "dark",
                  transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = T.saffron}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>
          </div>
          {errors.cancelUntilDate && <ErrMsg>{errors.cancelUntilDate}</ErrMsg>}
          <span style={{ fontSize: "0.7rem", color: T.muted }}>Cancellations allowed before this time</span>
        </div>

        {/* Toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <FieldLabel>OPTIONS</FieldLabel>
          <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 9, overflow: "hidden" }}>
            {[
              { key: "isPrebook", id: "isprebook", label: "ISPREBOOK", desc: "Allow advance pre-booking by staff" },
              { key: "isKiosk",   id: "iskiosk",   label: "ISKIOSK",   desc: "Show on kiosk terminal at canteen" },
            ].map((opt, idx) => (
              <label key={opt.key} htmlFor={opt.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.85rem 1rem", cursor: "pointer",
                  borderBottom: idx === 0 ? `1px solid rgba(0,0,0,0.04)` : "none",
                  transition: "background-color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
                    fontSize: "0.78rem", color: form[opt.key] ? T.saffron : T.white,
                    letterSpacing: "0.04em" }}>{opt.label}</div>
                  <div style={{ fontSize: "0.7rem", color: T.muted, marginTop: "0.15rem" }}>{opt.desc}</div>
                </div>
                <Toggle checked={form[opt.key]} onChange={v => set(opt.key, v)} id={opt.id} />
              </label>
            ))}
          </div>
        </div>

        {/* Summary preview */}
        {form.menuCode && (
          <div style={{ backgroundColor: "rgba(255,153,51,0.06)",
            border: "1px solid rgba(255,153,51,0.18)", borderRadius: 8,
            padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <div style={{ fontSize: "0.7rem", color: T.saffron, fontWeight: 600,
              letterSpacing: "0.08em", fontFamily: "'Space Grotesk',sans-serif",
              textTransform: "uppercase", marginBottom: "0.1rem" }}>Preview</div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <PreviewItem label="Slot" value={`${selectedSlot.icon} ${selectedSlot.label}`} />
              <PreviewItem label="Avail / Max" value={`${form.availQty || "—"} / ${form.maxQty || "—"}`} />
              <PreviewItem label="Pre-book" value={form.isPrebook ? "Yes" : "No"} />
              <PreviewItem label="Kiosk" value={form.isKiosk ? "Yes" : "No"} />
            </div>
          </div>
        )}
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
          {saving ? <><Spinner />Saving…</> : "Schedule →"}
        </button>
      </div>
    </div>
  )
}

function RemarksModal({ entry, action, onClose, onConfirm }) {
  const [remarks, setRemarks] = useState("")
  const [saving, setSaving] = useState(false)
  const isApprove = action === "APPROVED"
  const slot = DAY_SLOTS.find(s => s.code === entry.daySlot)

  const handleConfirm = () => {
    if (action === "REJECTED" && !remarks.trim()) return
    setSaving(true)
    setTimeout(() => { onConfirm(entry.id, action, remarks); setSaving(false) }, 500)
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex",
      alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
      animation: "fadeIn 0.15s ease-out" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}`}</style>

      <div style={{ width: "100%", maxWidth: 420, backgroundColor: T.card,
        border: `1px solid ${isApprove ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>

        <div style={{ padding: "1.1rem 1.4rem",
          backgroundColor: isApprove ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            backgroundColor: isApprove ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.13)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem" }}>
            {isApprove ? "✓" : "✕"}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.95rem",
              fontWeight: 700, margin: 0,
              color: isApprove ? "#4ade80" : "#f87171" }}>
              {isApprove ? "Approve Menu Slot" : "Reject Menu Slot"}
            </h3>
            <p style={{ fontSize: "0.72rem", color: T.silver, margin: "0.15rem 0 0" }}>
              {entry.menuCode} · {slot.icon} {slot.label}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none",
            color: T.silver, cursor: "pointer", borderRadius: 6, display: "flex",
            transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = T.white)}
            onMouseLeave={e => (e.currentTarget.style.color = T.silver)}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: "0.85rem 1.4rem", borderBottom: `1px solid ${T.border}`,
          backgroundColor: "rgba(0,0,0,0.018)" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: T.white }}>
            {entry.itemName}
          </div>
          <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.4rem" }}>
            <span style={{ fontSize: "0.72rem", color: T.silver }}>
              Qty: <strong style={{ color: T.white }}>{entry.availQty}/{entry.maxQty}</strong>
            </span>
            <span style={{ fontSize: "0.72rem", color: T.silver }}>
              Book until: <strong style={{ color: T.white }}>{formatDate(entry.bookUntilDate)} {entry.bookUntilTime}</strong>
            </span>
          </div>
        </div>

        <div style={{ padding: "1.1rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.68rem",
            fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            color: T.saffron, display: "flex", gap: "0.3rem" }}>
            REMARKS {action === "REJECTED" && <span style={{ color: "#f87171" }}>*</span>}
          </label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
            placeholder={isApprove ? "Optional remarks for approval…" : "State reason for rejection (required)"}
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 7, padding: "0.65rem 0.85rem", color: T.white,
              fontSize: "0.82rem", outline: "none", resize: "none",
              fontFamily: "'Inter',sans-serif", lineHeight: 1.5,
              transition: "border-color 0.2s, box-shadow 0.2s" }}
            onFocus={e => { e.target.style.borderColor = isApprove ? "#4ade80" : "#f87171"; e.target.style.boxShadow = `0 0 0 3px ${isApprove ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}` }}
            onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none" }} />
          {action === "REJECTED" && !remarks.trim() && (
            <span style={{ fontSize: "0.7rem", color: "#f87171" }}>Reason is required for rejection</span>
          )}
        </div>

        <div style={{ padding: "0.85rem 1.4rem", borderTop: `1px solid ${T.border}`,
          display: "flex", gap: "0.65rem" }}>
          <button onClick={onClose}
            style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${T.border}`,
              borderRadius: 7, color: T.silver, fontSize: "0.85rem", fontWeight: 600,
              fontFamily: "'Space Grotesk',sans-serif", padding: "0.6rem", cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.white }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.silver }}>
            Cancel
          </button>
          <button disabled={saving || (action === "REJECTED" && !remarks.trim())}
            onClick={handleConfirm}
            style={{ flex: 2, border: "none", borderRadius: 7,
              fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
              padding: "0.6rem", cursor: "pointer",
              backgroundColor: saving ? "rgba(0,0,0,0.06)"
                : isApprove ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
              color: isApprove ? "#4ade80" : "#f87171",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              transition: "background-color 0.2s",
              opacity: (action === "REJECTED" && !remarks.trim()) ? 0.5 : 1 }}
            onMouseEnter={e => {
              if (!saving && !(action === "REJECTED" && !remarks.trim()))
                e.currentTarget.style.backgroundColor = isApprove ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = isApprove ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"
            }}>
            {saving ? <><Spinner color={isApprove ? "#4ade80" : "#f87171"} />Processing…</>
              : isApprove ? "✓ Confirm Approval" : "✕ Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DayMenuView({ menuItems, entries, setEntries }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [filterSlot, setFilterSlot] = useState("ALL")

  const pending = entries.filter(e => e.status === "PENDING")

  const handleSchedule = (entry) => {
    setEntries(prev => [{
      ...entry, id: Date.now(), status: "PENDING", remarks: "",
      createdAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    }, ...prev])
    setPanelOpen(false)
  }

  const handleResolve = (id, action, remarks) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: action, remarks } : e))
    setModal(null)
  }

  const filtered = entries.filter(e =>
    filterSlot === "ALL" ? true : e.daySlot === filterSlot
  )

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem",
      padding: "1.5rem", overflowY: "auto" }}>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(3) hue-rotate(10deg); cursor: pointer;
        }
      `}</style>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.1rem",
            fontWeight: 700, margin: 0, color: T.white }}>Day Menu Planning</h2>
          <p style={{ fontSize: "0.78rem", color: T.silver, margin: "0.25rem 0 0" }}>
            Schedule, review and approve daily canteen menu slots
          </p>
        </div>
        <button onClick={() => setPanelOpen(true)}
          style={{ backgroundColor: T.saffron, color: "#0F172A", fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700, fontSize: "0.8rem", border: "none", borderRadius: 7,
            padding: "0.55rem 1.1rem", cursor: "pointer",
            boxShadow: "0 2px 12px rgba(255,153,51,0.3)",
            display: "flex", alignItems: "center", gap: "0.4rem",
            transition: "background-color 0.2s,transform 0.1s" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#ffaa44"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.saffron; e.currentTarget.style.transform = "translateY(0)" }}>
          <PlusIcon /> Schedule Menu
        </button>
      </div>

      {/* Pending approvals widget */}
      {pending.length > 0 && (
        <div style={{ backgroundColor: T.card, border: "1px solid rgba(250,204,21,0.2)",
          borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.85rem 1.25rem", backgroundColor: "rgba(250,204,21,0.06)",
            borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%",
                backgroundColor: "#facc15", boxShadow: "0 0 6px #facc1580" }} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                fontSize: "0.85rem", color: T.white }}>Pending Approvals</span>
              <span style={{ backgroundColor: "rgba(250,204,21,0.15)", color: "#facc15",
                border: "1px solid rgba(250,204,21,0.3)", borderRadius: 20,
                fontSize: "0.68rem", fontWeight: 700, padding: "0.1rem 0.5rem" }}>
                {pending.length}
              </span>
            </div>
            <span style={{ fontSize: "0.72rem", color: T.silver }}>Awaiting manager sign-off</span>
          </div>

          <div>
            {pending.map((entry, idx) => {
              const slot = DAY_SLOTS.find(s => s.code === entry.daySlot)
              return (
                <div key={entry.id}
                  style={{ display: "grid", alignItems: "center",
                    gridTemplateColumns: "140px 1fr auto auto auto auto 180px",
                    gap: "0.75rem", padding: "0.85rem 1.25rem",
                    borderBottom: idx < pending.length - 1 ? `1px solid rgba(0,0,0,0.04)` : "none",
                    transition: "background-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.surface)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>{slot.icon}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em",
                      color: slot.color, fontFamily: "'Space Grotesk',sans-serif" }}>
                      {slot.label}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: T.white }}>{entry.itemName}</div>
                    <div style={{ fontSize: "0.7rem", color: T.silver, fontFamily: "monospace" }}>{entry.menuCode}</div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: T.white }}>{entry.availQty}</div>
                    <div style={{ fontSize: "0.65rem", color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Avail</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: T.white }}>{entry.maxQty}</div>
                    <div style={{ fontSize: "0.65rem", color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Max</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <MiniTag active={entry.isPrebook} label="PRE-BOOK" />
                    <MiniTag active={entry.isKiosk} label="KIOSK" />
                  </div>

                  <div style={{ fontSize: "0.68rem", color: T.muted, whiteSpace: "nowrap" }}>{entry.createdAt}</div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => setModal({ entry, action: "APPROVED" })}
                      style={{ flex: 1, padding: "0.4rem 0.6rem", borderRadius: 6, border: "none",
                        backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80",
                        fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                        fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "0.04em",
                        transition: "background-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.28)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.15)")}>
                      ✓ Approve
                    </button>
                    <button onClick={() => setModal({ entry, action: "REJECTED" })}
                      style={{ flex: 1, padding: "0.4rem 0.6rem", borderRadius: 6, border: "none",
                        backgroundColor: "rgba(239,68,68,0.13)", color: "#f87171",
                        fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                        fontFamily: "'Space Grotesk',sans-serif", letterSpacing: "0.04em",
                        transition: "background-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.25)")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.13)")}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All schedules table */}
      <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`,
        borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.85rem 1.25rem", borderBottom: `1px solid ${T.border}`,
          backgroundColor: T.surface, flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
            fontSize: "0.82rem", color: T.white }}>All Scheduled Menus</span>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {(["ALL", ...DAY_SLOTS.map(s => s.code)]).map(s => {
              const active = filterSlot === s
              const slot = s !== "ALL" ? DAY_SLOTS.find(d => d.code === s) : null
              return (
                <button key={s} onClick={() => setFilterSlot(s)}
                  style={{ padding: "0.25rem 0.65rem", borderRadius: 20, fontSize: "0.7rem",
                    fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                    backgroundColor: active ? (slot ? `${slot.color}22` : T.saffronDim) : "transparent",
                    color: active ? (slot ? slot.color : T.saffron) : T.silver,
                    borderColor: active ? (slot ? `${slot.color}55` : T.saffron) : T.border }}>
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: "grid",
          gridTemplateColumns: "120px 100px 1fr 80px 80px 90px 90px 100px",
          padding: "0 1.25rem", borderBottom: `1px solid ${T.border}`,
          backgroundColor: "rgba(0,0,0,0.025)" }}>
          {["Day Slot","Menu Code","Item Name","Avail","Max","Pre-book","Kiosk","Status"].map(h => (
            <div key={h} style={{ padding: "0.55rem 0", fontSize: "0.65rem", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase", color: T.silver,
              fontFamily: "'Space Grotesk',sans-serif" }}>{h}</div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {filtered.length === 0
            ? <div style={{ padding: "2.5rem", textAlign: "center", color: T.silver, fontSize: "0.82rem" }}>
                No scheduled menus for this filter.
              </div>
            : filtered.map((entry, idx) => {
                const slot = DAY_SLOTS.find(s => s.code === entry.daySlot)
                const statusColors = entry.status === "APPROVED"
                  ? { bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.25)" }
                  : entry.status === "REJECTED"
                  ? { bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.25)" }
                  : { bg: "rgba(250,204,21,0.12)", text: "#facc15", border: "rgba(250,204,21,0.25)" }
                return (
                  <div key={entry.id}
                    style={{ display: "grid",
                      gridTemplateColumns: "120px 100px 1fr 80px 80px 90px 90px 100px",
                      padding: "0 1.25rem", alignItems: "center",
                      backgroundColor: idx % 2 === 0 ? "rgba(0,0,0,0.018)" : "transparent",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      transition: "background-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.surface)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "rgba(0,0,0,0.018)" : "transparent")}>
                    <div style={{ padding: "0.65rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.8rem" }}>{slot.icon}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: slot.color }}>{slot.label}</span>
                    </div>
                    <div style={{ padding: "0.65rem 0", fontFamily: "monospace", fontSize: "0.75rem", color: T.silver }}>{entry.menuCode}</div>
                    <div style={{ padding: "0.65rem 0", fontSize: "0.8rem", color: T.white }}>{entry.itemName}</div>
                    <div style={{ padding: "0.65rem 0", fontSize: "0.82rem", color: T.white, fontWeight: 600 }}>{entry.availQty}</div>
                    <div style={{ padding: "0.65rem 0", fontSize: "0.82rem", color: T.white, fontWeight: 600 }}>{entry.maxQty}</div>
                    <div style={{ padding: "0.65rem 0" }}><MiniTag active={entry.isPrebook} label="ON" /></div>
                    <div style={{ padding: "0.65rem 0" }}><MiniTag active={entry.isKiosk} label="ON" /></div>
                    <div style={{ padding: "0.65rem 0" }}>
                      <span style={{ padding: "0.2rem 0.55rem", borderRadius: 20, fontSize: "0.65rem",
                        fontWeight: 700, letterSpacing: "0.04em",
                        backgroundColor: statusColors.bg, color: statusColors.text,
                        border: `1px solid ${statusColors.border}` }}>
                        {entry.status === "APPROVED" ? "Approved" : entry.status === "REJECTED" ? "Rejected" : "Pending"}
                      </span>
                    </div>
                  </div>
                )
              })}
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, padding: "0.5rem 1.25rem",
          fontSize: "0.72rem", color: T.muted, display: "flex", justifyContent: "space-between" }}>
          <span>{filtered.length} schedules · {pending.length} pending</span>
          <span>Day Menu · ISRO CMS</span>
        </div>
      </div>

      {panelOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}
          onClick={e => { if (e.target === e.currentTarget) setPanelOpen(false) }}>
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />
          <DayMenuPanel menuItems={menuItems.filter(m => m.status === "A")}
            onClose={() => setPanelOpen(false)} onSave={handleSchedule} />
        </div>
      )}

      {modal && (
        <RemarksModal
          entry={modal.entry}
          action={modal.action}
          onClose={() => setModal(null)}
          onConfirm={(id, action, remarks) => handleResolve(id, action, remarks)}
        />
      )}
    </div>
  )
}
