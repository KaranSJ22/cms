import { useState } from "react"
import { T, NAV } from "../constants/tokens.js"
import { DAY_SLOTS, PREBOOK_MENUS, ACTIVE_SLOTS } from "../constants/data.js"
import { Spinner } from "../components/icons/Icons.jsx"

export function buildOffers(days) {
  const offers = []
  const base = new Date("2026-08-11")
  for (let d = 1; d <= days; d++) {
    const dt = new Date(base)
    dt.setDate(base.getDate() + d)
    if (dt.getDay() === 0) continue
    const iso = dt.toISOString().split("T")[0]
    ACTIVE_SLOTS.forEach(slot => {
      const def = PREBOOK_MENUS.find(m => m.slot === slot)
      const item = def.items[(d + def.items.length - 1) % def.items.length]
      offers.push({
        slotKey: `${iso}_${slot}`,
        date: iso,
        daySlot: slot,
        menuCode: item.code,
        itemName: item.name,
        price: def.price,
      })
    })
  }
  return offers
}

export function formatDay(iso) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })
}

export function isWeekend(iso) {
  const d = new Date(iso + "T00:00:00")
  return d.getDay() === 6
}

export default function PreBookingView() {
  const [range, setRange] = useState("7D")
  const [svcFilter, setSvcFilter] = useState("ALL")
  const [qty, setQty] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const dayCount = range === "1D" ? 1 : range === "7D" ? 7 : 30
  const allOffers = buildOffers(dayCount)

  const visibleOffers = svcFilter === "ALL"
    ? allOffers
    : allOffers.filter(o => o.daySlot === svcFilter)

  const byDate = visibleOffers.reduce((acc, o) => {
    if (!acc[o.date]) acc[o.date] = []
    acc[o.date].push(o)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort()

  const step = (key, delta) =>
    setQty(prev => {
      const next = Math.max(0, Math.min(5, (prev[key] ?? 0) + delta))
      return { ...prev, [key]: next }
    })

  const clearQty = () => setQty({})

  const activeOffers   = allOffers.filter(o => (qty[o.slotKey] ?? 0) > 0)
  const totalPortions  = activeOffers.reduce((s, o) => s + (qty[o.slotKey] ?? 0), 0)
  const totalAmount    = activeOffers.reduce((s, o) => s + o.price * (qty[o.slotKey] ?? 0), 0)
  const uniqueDays     = new Set(activeOffers.map(o => o.date)).size

  const handleConfirm = () => {
    setConfirming(true)
    setTimeout(() => { setConfirming(false); setConfirmed(true); clearQty() }, 900)
    setTimeout(() => setConfirmed(false), 4500)
  }

  const rangeTabs = [
    { code: "1D",  label: "Next Day",     sub: "Tomorrow" },
    { code: "7D",  label: "Next 7 Days",  sub: "This week" },
    { code: "30D", label: "Next 30 Days", sub: "This month" },
  ]

  const svcPills = [
    { code: "ALL",       label: "All Services", icon: "🍽" },
    { code: "BREAKFAST", label: "Breakfast",     icon: "🌅" },
    { code: "LUNCH",     label: "Lunch",         icon: "☀️" },
    { code: "SNACKS",    label: "Snacks",        icon: "🫖" },
    { code: "DINNER",    label: "Dinner",        icon: "🌙" },
  ]

  const stepBtn = (disabled) => ({
    width: 30, height: 30, borderRadius: 6,
    border: `1.5px solid ${disabled ? T.border : T.borderHover}`,
    backgroundColor: disabled ? "#F8FAFC" : "#FFFFFF",
    color: disabled ? T.muted : T.white,
    fontSize: "1rem", lineHeight: 1, cursor: disabled ? "default" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 600, flexShrink: 0,
    transition: "all 0.12s",
  })

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#F8FAFC",
      fontFamily: "'Inter',sans-serif", minHeight: 0, position: "relative" }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp     { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .step-btn:hover:not(:disabled) { background:#F1F5F9 !important; border-color:#94A3B8 !important; }
      `}</style>

      <div style={{ flex: 1, overflowY: "auto",
        paddingBottom: totalPortions > 0 ? "92px" : "1.5rem" }}>
        <div style={{ padding: "1.5rem 1.5rem 0" }}>

          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.1rem",
              fontWeight: 700, margin: 0, color: T.white }}>
              Meal Pre-Booking
            </h2>
            <p style={{ fontSize: "0.78rem", color: T.silver, margin: "0.25rem 0 0" }}>
              Order meals in advance · Permanent Employee · EMP-1042
            </p>
          </div>

          {/* Date-range tabs */}
          <div style={{ backgroundColor: "#FFFFFF", border: `1px solid ${T.border}`,
            borderRadius: 10, padding: "0.3rem", display: "inline-flex", gap: "0.2rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "0.85rem" }}>
            {rangeTabs.map(t => {
              const active = range === t.code
              return (
                <button key={t.code} onClick={() => { setRange(t.code); clearQty() }}
                  style={{ padding: "0.5rem 1.2rem", borderRadius: 8, border: "none",
                    cursor: "pointer", transition: "all 0.18s ease",
                    backgroundColor: active ? NAV.bg : "transparent",
                    boxShadow: active ? "0 2px 8px rgba(15,23,42,0.2)" : "none" }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                    fontSize: "0.82rem", color: active ? "#FFFFFF" : T.silver, transition: "color 0.18s" }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: "0.63rem",
                    color: active ? "rgba(255,255,255,0.5)" : T.muted,
                    marginTop: "0.1rem", transition: "color 0.18s" }}>
                    {t.sub}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Service filter pills */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {svcPills.map(p => {
              const active = svcFilter === p.code
              const slot = DAY_SLOTS.find(s => s.code === p.code)
              const accentColor = slot?.color ?? T.saffron
              return (
                <button key={p.code}
                  onClick={() => setSvcFilter(p.code)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.38rem 0.85rem", borderRadius: 20, border: "1.5px solid",
                    cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                    fontFamily: "'Space Grotesk',sans-serif",
                    transition: "all 0.15s ease",
                    backgroundColor: active
                      ? (p.code === "ALL" ? NAV.bg : `${accentColor}18`)
                      : "#FFFFFF",
                    borderColor: active
                      ? (p.code === "ALL" ? NAV.bg : accentColor)
                      : T.border,
                    color: active
                      ? (p.code === "ALL" ? "#FFFFFF" : accentColor)
                      : T.silver,
                    boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
                  <span style={{ fontSize: "0.82rem", lineHeight: 1 }}>{p.icon}</span>
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Confirmed banner */}
          {confirmed && (
            <div style={{ backgroundColor: "rgba(22,163,74,0.08)",
              border: "1px solid rgba(22,163,74,0.25)", borderRadius: 9,
              padding: "0.85rem 1.1rem", display: "flex", alignItems: "center", gap: "0.65rem",
              marginBottom: "1.25rem", animation: "fadeSlideIn 0.25s ease" }}>
              <span style={{ fontSize: "1.25rem" }}>✅</span>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#16a34a" }}>
                  Bookings confirmed successfully!
                </div>
                <div style={{ fontSize: "0.72rem", color: T.silver, marginTop: "0.1rem" }}>
                  Your pre-booking request has been submitted. A confirmation will be sent.
                </div>
              </div>
            </div>
          )}

          {/* Date cards */}
          {dates.length === 0 ? (
            <div style={{ backgroundColor: "#FFFFFF", border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "3rem", textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>🍽</div>
              <div style={{ fontSize: "0.85rem", color: T.silver }}>
                No meal slots available for the selected service and date range.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", paddingBottom: "1rem" }}>
              {dates.map(date => {
                const offers = byDate[date]
                const dayPortions = offers.reduce((s, o) => s + (qty[o.slotKey] ?? 0), 0)
                const dayTotal    = offers.reduce((s, o) => s + o.price * (qty[o.slotKey] ?? 0), 0)
                const hasOrder    = dayPortions > 0
                const weekend     = isWeekend(date)

                return (
                  <div key={date}
                    style={{ backgroundColor: "#FFFFFF",
                      border: `1.5px solid ${hasOrder ? "rgba(249,115,22,0.35)" : T.border}`,
                      borderRadius: 10, overflow: "hidden",
                      boxShadow: hasOrder
                        ? "0 3px 16px rgba(249,115,22,0.1)"
                        : "0 1px 4px rgba(0,0,0,0.05)",
                      transition: "border-color 0.2s, box-shadow 0.2s" }}>

                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "center",
                      padding: "0.85rem 1.2rem",
                      backgroundColor: hasOrder ? "rgba(249,115,22,0.03)" : "#F8FAFC",
                      borderBottom: `1px solid ${T.border}` }}>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                          backgroundColor: hasOrder ? T.saffron : NAV.bg,
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                          transition: "background-color 0.2s",
                          boxShadow: hasOrder ? "0 2px 8px rgba(249,115,22,0.3)" : "none" }}>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
                            fontSize: "1rem", color: "#FFFFFF", lineHeight: 1 }}>
                            {new Date(date + "T00:00:00").getDate()}
                          </span>
                          <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.65)",
                            textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                              fontSize: "0.9rem", color: T.white }}>
                              {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" })}
                            </span>
                            {weekend && (
                              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.07em",
                                padding: "0.1rem 0.42rem", borderRadius: 20,
                                backgroundColor: "rgba(100,116,139,0.1)", color: "#64748b",
                                border: `1px solid ${T.border}` }}>
                                SAT
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: T.muted, marginTop: "0.08rem" }}>
                            {offers.length} slot{offers.length !== 1 ? "s" : ""} · {
                              new Date(date + "T00:00:00").toLocaleDateString("en-IN",
                                { day: "numeric", month: "short", year: "numeric" })
                            }
                          </div>
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        {hasOrder ? (
                          <div style={{ backgroundColor: "rgba(249,115,22,0.1)",
                            border: "1px solid rgba(249,115,22,0.25)",
                            borderRadius: 8, padding: "0.35rem 0.75rem" }}>
                            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
                              fontSize: "1rem", color: T.saffron, lineHeight: 1 }}>
                              ₹{dayTotal}
                            </div>
                            <div style={{ fontSize: "0.6rem", color: T.muted, marginTop: "0.15rem",
                              textTransform: "uppercase", letterSpacing: "0.07em" }}>
                              Daily Total
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.7rem", color: T.muted }}>₹0 ordered</div>
                        )}
                      </div>
                    </div>

                    {/* Meal slot rows */}
                    <div>
                      {offers.map((offer, idx) => {
                        const q       = qty[offer.slotKey] ?? 0
                        const ordered = q > 0
                        const slotDef = DAY_SLOTS.find(s => s.code === offer.daySlot)
                        const lineTotal = offer.price * q

                        return (
                          <div key={offer.slotKey}
                            style={{ display: "flex", alignItems: "center", gap: "1rem",
                              padding: "0.9rem 1.2rem",
                              borderBottom: idx < offers.length - 1
                                ? `1px solid rgba(226,232,240,0.55)` : "none",
                              backgroundColor: ordered ? "rgba(249,115,22,0.022)" : "transparent",
                              transition: "background-color 0.12s" }}>

                            {/* Slot pill */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem",
                              width: 96, flexShrink: 0 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                                backgroundColor: `${slotDef.color}18`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.85rem" }}>
                                {slotDef.icon}
                              </div>
                              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.7rem",
                                fontWeight: 700, color: slotDef.color, letterSpacing: "0.04em" }}>
                                {slotDef.label}
                              </span>
                            </div>

                            {/* Item name + code */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.85rem", color: T.white,
                                fontWeight: ordered ? 600 : 400,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                transition: "font-weight 0.1s" }}>
                                {offer.itemName}
                              </div>
                              <div style={{ fontSize: "0.66rem", color: T.muted,
                                fontFamily: "monospace", marginTop: "0.1rem" }}>
                                {offer.menuCode}
                              </div>
                            </div>

                            {/* Unit price */}
                            <div style={{ flexShrink: 0, textAlign: "right", minWidth: 48 }}>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif",
                                fontSize: "0.82rem", fontWeight: 600,
                                color: ordered ? T.saffron : T.silver,
                                transition: "color 0.15s" }}>
                                ₹{offer.price}
                              </div>
                              <div style={{ fontSize: "0.6rem", color: T.muted, marginTop: "0.05rem" }}>
                                per portion
                              </div>
                            </div>

                            {/* Quantity stepper */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0", flexShrink: 0,
                              border: `1.5px solid ${ordered ? "rgba(249,115,22,0.4)" : T.border}`,
                              borderRadius: 8, overflow: "hidden",
                              boxShadow: ordered ? "0 0 0 3px rgba(249,115,22,0.1)" : "none",
                              transition: "border-color 0.2s, box-shadow 0.2s",
                              backgroundColor: "#FFFFFF" }}>
                              <button className="step-btn"
                                disabled={q === 0}
                                onClick={() => step(offer.slotKey, -1)}
                                style={{ ...stepBtn(q === 0), borderRadius: 0,
                                  border: "none", borderRight: `1px solid ${T.border}`,
                                  color: q === 0 ? T.muted : "#dc2626" }}>
                                −
                              </button>
                              <div style={{ width: 36, textAlign: "center", fontFamily: "'Space Grotesk',sans-serif",
                                fontWeight: 700, fontSize: "0.9rem",
                                color: ordered ? T.saffron : T.silver,
                                transition: "color 0.15s", padding: "0 2px" }}>
                                {q}
                              </div>
                              <button className="step-btn"
                                disabled={q >= 5}
                                onClick={() => step(offer.slotKey, 1)}
                                style={{ ...stepBtn(q >= 5), borderRadius: 0,
                                  border: "none", borderLeft: `1px solid ${T.border}`,
                                  color: q >= 5 ? T.muted : "#16a34a" }}>
                                +
                              </button>
                            </div>

                            {/* Line total */}
                            <div style={{ flexShrink: 0, textAlign: "right", minWidth: 56,
                              opacity: ordered ? 1 : 0, transition: "opacity 0.2s" }}>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif",
                                fontWeight: 700, fontSize: "0.88rem", color: T.white }}>
                                ₹{lineTotal}
                              </div>
                              <div style={{ fontSize: "0.6rem", color: T.muted, marginTop: "0.05rem" }}>
                                subtotal
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky summary & confirm bar */}
      {totalPortions > 0 && (
        <div style={{ position: "sticky", bottom: 0, left: 0, right: 0,
          backgroundColor: NAV.bg, borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "0.85rem 1.5rem", display: "flex", alignItems: "center",
          gap: "1.25rem", zIndex: 50,
          boxShadow: "0 -6px 28px rgba(0,0,0,0.28)",
          animation: "slideUp 0.22s ease" }}>

          <div style={{ display: "flex", gap: "1.5rem", flex: 1 }}>
            {[
              { label: "Portions",    value: String(totalPortions), color: "#FFFFFF" },
              { label: "Days",        value: String(uniqueDays),    color: "#FFFFFF" },
              { label: "Grand Total", value: `₹${totalAmount}`,    color: T.saffron },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                    fontSize: "1.15rem", color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)",
                    marginTop: "0.2rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {s.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.1)" }} />
                )}
              </div>
            ))}
          </div>

          <button onClick={clearQty}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 7, padding: "0.52rem 1rem", color: "rgba(255,255,255,0.5)",
              fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s",
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "#FFFFFF" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)" }}>
            Clear all
          </button>

          <button disabled={confirming} onClick={handleConfirm}
            style={{ backgroundColor: confirming ? "rgba(249,115,22,0.55)" : T.saffron,
              border: "none", borderRadius: 8, padding: "0.62rem 1.75rem",
              color: "#0F172A", fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700, fontSize: "0.88rem",
              cursor: confirming ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "0.45rem",
              boxShadow: confirming ? "none" : "0 0 0 3px rgba(249,115,22,0.22), 0 4px 18px rgba(249,115,22,0.4)",
              transition: "all 0.18s" }}
            onMouseEnter={e => { if (!confirming) { e.currentTarget.style.backgroundColor = "#fb923c"; e.currentTarget.style.transform = "translateY(-1px)" } }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = confirming ? "rgba(249,115,22,0.55)" : T.saffron; e.currentTarget.style.transform = "translateY(0)" }}>
            {confirming ? <><Spinner />Confirming…</> : <>Confirm Bookings →</>}
          </button>
        </div>
      )}
    </div>
  )
}
