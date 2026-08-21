import { useState } from "react"
import { T, NAV } from "../constants/tokens.js"
import { DAY_SLOTS, BOOKING_STATUS_META, KITCHEN_PROD, AUDIT_BOOKINGS } from "../constants/data.js"
import { CalendarIcon } from "../components/icons/Icons.jsx"

export function getProdItems(date, service) {
  if (service === "ALL") {
    const slots = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]
    return slots.flatMap(s => KITCHEN_PROD[`${date}_${s}`] ?? [])
  }
  return KITCHEN_PROD[`${date}_${service}`] ?? []
}

export default function BookingsMonitorView() {
  const today = "2026-08-11"
  const [selectedDate, setSelectedDate] = useState(today)
  const [serviceFilter, setServiceFilter] = useState("ALL")

  const prodItems = getProdItems(selectedDate, serviceFilter)

  const auditRows = AUDIT_BOOKINGS.filter(b => {
    const dateMatch = b.bookedAt === selectedDate
    const svcMatch  = serviceFilter === "ALL" || b.service === serviceFilter
    return dateMatch && svcMatch
  })

  const grandTotal    = prodItems.reduce((s, p) => s + p.toPrepare, 0)
  const grandServed   = prodItems.reduce((s, p) => s + p.served, 0)
  const grandRemaining = prodItems.reduce((s, p) => s + (p.toPrepare - p.served - p.partial - p.noShow), 0)

  const serviceOptions = [
    { code: "ALL",       label: "All Services" },
    { code: "BREAKFAST", label: "Breakfast" },
    { code: "LUNCH",     label: "Lunch" },
    { code: "SNACKS",    label: "Snacks" },
    { code: "DINNER",    label: "Dinner" },
  ]

  const auditCols = "52px 180px 100px 110px 1fr 120px"

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem",
      padding: "1.5rem", backgroundColor: "#F8FAFC", overflowY: "auto" }}>

      {/* Page heading */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.1rem",
            fontWeight: 700, margin: 0, color: T.white }}>
            Kitchen Production List
          </h2>
          <p style={{ fontSize: "0.78rem", color: T.silver, margin: "0.25rem 0 0" }}>
            Aggregate item quantities for kitchen preparation · individual audit below
          </p>
        </div>
        <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: T.muted,
          backgroundColor: "#FFFFFF", border: `1px solid ${T.border}`,
          borderRadius: 6, padding: "0.25rem 0.6rem" }}>
          As of 12:48 IST
        </span>
      </div>

      {/* Control bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>

        {/* Date picker */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", zIndex: 1 }}>
            <CalendarIcon size={15} color={T.silver} />
          </div>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${T.border}`,
              borderRadius: 7, padding: "0.55rem 0.85rem 0.55rem 2.25rem",
              color: T.white, fontSize: "0.82rem", outline: "none",
              fontFamily: "'Inter',sans-serif", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              cursor: "pointer", colorScheme: "light", transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = T.saffron}
            onBlur={e => e.target.style.borderColor = T.border} />
        </div>

        {/* Service dropdown */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", fontSize: "0.85rem" }}>🍽</div>
          <select value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${T.border}`,
              borderRadius: 7, padding: "0.55rem 2.25rem 0.55rem 2.1rem",
              color: T.white, fontSize: "0.82rem", outline: "none",
              fontFamily: "'Inter',sans-serif", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              appearance: "none", cursor: "pointer",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394A3B8' viewBox='0 0 16 16'%3E%3Cpath d='M8 10.5l-4-4h8z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 0.65rem center",
              transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = T.saffron}
            onBlur={e => e.target.style.borderColor = T.border}>
            {serviceOptions.map(o => (
              <option key={o.code} value={o.code}>{o.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: "1.5rem" }}>
          {[
            { label: "Total to Prepare", value: grandTotal,     color: "#1e3a8a" },
            { label: "Served",           value: grandServed,    color: "#16a34a" },
            { label: "Remaining",        value: grandRemaining, color: T.saffron },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                fontSize: "1.15rem", color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.62rem", color: T.muted, marginTop: "0.15rem",
                textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmed Item Quantities Widget */}
      <div style={{ backgroundColor: "#FFFFFF", border: `1px solid ${T.border}`,
        borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

        {/* Widget header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.9rem 1.25rem", borderBottom: `1px solid ${T.border}`,
          backgroundColor: NAV.bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%",
              backgroundColor: T.saffron, boxShadow: `0 0 8px ${T.saffron}88` }} />
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "0.88rem", color: "#FFFFFF", letterSpacing: "0.02em" }}>
              Confirmed Item Quantities
            </span>
          </div>
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)",
            fontFamily: "monospace", letterSpacing: "0.04em" }}>
            {prodItems.length} item{prodItems.length !== 1 ? "s" : ""} · {serviceFilter === "ALL" ? "All services" : serviceFilter}
          </span>
        </div>

        {/* Item grid */}
        {prodItems.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: T.silver, fontSize: "0.85rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>🍽</div>
            No production data for this date and service.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "0", borderTop: "none" }}>
            {prodItems.map((item, idx) => {
              const remaining = item.toPrepare - item.served - item.partial - item.noShow
              const servedPct  = Math.round((item.served / item.toPrepare) * 100)
              const partPct    = Math.round((item.partial / item.toPrepare) * 100)
              const noShowPct  = Math.round((item.noShow / item.toPrepare) * 100)
              const slot = DAY_SLOTS.find(s => s.code === item.service)
              const isLast = idx === prodItems.length - 1

              return (
                <div key={item.menuCode + item.service}
                  style={{ padding: "1.25rem 1.35rem",
                    borderRight: (idx % 2 === 0 && idx < prodItems.length - 1) ? `1px solid ${T.border}` : "none",
                    borderBottom: !isLast ? `1px solid ${T.border}` : "none",
                    transition: "background-color 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FFFFFF")}>

                  <div style={{ display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
                        <span style={{ fontSize: "0.75rem" }}>{slot.icon}</span>
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em",
                          textTransform: "uppercase", color: slot.color }}>
                          {slot.label}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                        fontSize: "1rem", color: T.white, lineHeight: 1.2 }}>
                        {item.itemName}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "0.68rem",
                        color: T.muted, marginTop: "0.2rem" }}>
                        {item.menuCode}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800,
                        fontSize: "2.4rem", lineHeight: 1, color: "#0F172A" }}>
                        {item.toPrepare}
                      </div>
                      <div style={{ fontSize: "0.62rem", color: T.muted, textTransform: "uppercase",
                        letterSpacing: "0.08em", marginTop: "0.15rem" }}>to prepare</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 8, borderRadius: 4, backgroundColor: "#F1F5F9",
                    overflow: "hidden", display: "flex", marginBottom: "0.85rem" }}>
                    <div style={{ width: `${servedPct}%`, backgroundColor: "#16a34a",
                      transition: "width 0.4s ease" }} />
                    <div style={{ width: `${partPct}%`, backgroundColor: "#eab308",
                      transition: "width 0.4s ease" }} />
                    <div style={{ width: `${noShowPct}%`, backgroundColor: "#e2e8f0",
                      transition: "width 0.4s ease" }} />
                  </div>

                  {/* Three stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "0.5rem" }}>
                    {[
                      { label: "Served",    value: item.served,  color: "#16a34a", bg: "rgba(22,163,74,0.08)",  border: "rgba(22,163,74,0.18)" },
                      { label: "Remaining", value: remaining,    color: T.saffron, bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.18)" },
                      { label: "No-Show",   value: item.noShow,  color: "#64748b", bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.15)" },
                    ].map(stat => (
                      <div key={stat.label}
                        style={{ backgroundColor: stat.bg, border: `1px solid ${stat.border}`,
                          borderRadius: 7, padding: "0.55rem 0.65rem", textAlign: "center" }}>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                          fontSize: "1.25rem", color: stat.color, lineHeight: 1 }}>
                          {stat.value}
                        </div>
                        <div style={{ fontSize: "0.6rem", color: T.muted, marginTop: "0.2rem",
                          textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Widget footer */}
        {prodItems.length > 0 && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "0.65rem 1.35rem",
            backgroundColor: "#F8FAFC", display: "flex", gap: "2rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: T.muted, flex: 1 }}>
              {prodItems.length} menu item{prodItems.length !== 1 ? "s" : ""} · quantities updated in real-time
            </span>
            {[
              { label: "Grand Total", value: grandTotal,     color: "#0F172A" },
              { label: "Served",      value: grandServed,    color: "#16a34a" },
              { label: "Remaining",   value: grandRemaining, color: T.saffron },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                  fontSize: "0.92rem", color: s.color }}>
                  {s.value}
                </span>
                <span style={{ fontSize: "0.65rem", color: T.muted, textTransform: "uppercase",
                  letterSpacing: "0.06em" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Individual Booking Audit Table */}
      <div style={{ backgroundColor: "#FFFFFF", border: `1px solid ${T.border}`,
        borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

        {/* Table toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.85rem 1.25rem", borderBottom: `1px solid ${T.border}`,
          backgroundColor: "#F8FAFC", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "0.85rem", color: T.white }}>Booking Records</span>
            <span style={{ fontSize: "0.72rem", color: T.muted, marginLeft: "0.6rem" }}>
              Employee-level audit
            </span>
          </div>

          {/* Status legend */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            {Object.entries(BOOKING_STATUS_META).map(([code, meta]) => (
              <div key={code} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: meta.dot, flexShrink: 0 }} />
                <span style={{ fontSize: "0.65rem", color: T.silver }}>{code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: auditCols,
          padding: "0 1.25rem", borderBottom: `1px solid ${T.border}`,
          backgroundColor: "rgba(241,245,249,0.6)" }}>
          {["#", "Booking No", "Customer", "Service", "Menu Item", "Status"].map(h => (
            <div key={h} style={{ padding: "0.6rem 0", fontSize: "0.62rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", color: T.silver,
              fontFamily: "'Space Grotesk',sans-serif" }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {auditRows.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: T.silver, fontSize: "0.82rem" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📭</div>
              No individual records for the selected filter.
            </div>
          ) : auditRows.map((b, idx) => {
            const meta = BOOKING_STATUS_META[b.status]
            const slot = DAY_SLOTS.find(s => s.code === b.service)
            const even = idx % 2 === 0
            return (
              <div key={b.id}
                style={{ display: "grid", gridTemplateColumns: auditCols,
                  padding: "0 1.25rem", alignItems: "center",
                  backgroundColor: even ? "rgba(248,250,252,0.5)" : "#FFFFFF",
                  borderBottom: idx < auditRows.length - 1 ? "1px solid rgba(226,232,240,0.55)" : "none",
                  transition: "background-color 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(241,245,249,0.85)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = even ? "rgba(248,250,252,0.5)" : "#FFFFFF")}>

                <div style={{ padding: "0.7rem 0", fontSize: "0.68rem",
                  color: T.muted, fontFamily: "monospace" }}>
                  {String(idx + 1).padStart(2, "0")}
                </div>

                <div style={{ padding: "0.7rem 0", fontFamily: "monospace",
                  fontSize: "0.73rem", color: "#1e3a8a", fontWeight: 600, letterSpacing: "0.01em" }}>
                  {b.bookingNo}
                </div>

                <div style={{ padding: "0.7rem 0", fontSize: "0.8rem", color: T.white, fontWeight: 500 }}>
                  {b.customerId}
                </div>

                <div style={{ padding: "0.7rem 0", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.78rem" }}>{slot?.icon}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: slot?.color ?? T.silver }}>
                    {slot?.label ?? b.service}
                  </span>
                </div>

                <div style={{ padding: "0.7rem 0", minWidth: 0 }}>
                  <div style={{ fontSize: "0.78rem", color: T.white, fontWeight: 500,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.itemName}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: T.muted, marginTop: "0.05rem" }}>
                    {b.menuCode}
                  </div>
                </div>

                <div style={{ padding: "0.7rem 0" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.22rem 0.6rem", borderRadius: 20, fontSize: "0.67rem",
                    fontWeight: 700, letterSpacing: "0.05em",
                    fontFamily: "'Space Grotesk',sans-serif",
                    backgroundColor: meta.bg, color: meta.text,
                    border: `1px solid ${meta.border}` }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%",
                      backgroundColor: meta.dot, flexShrink: 0 }} />
                    {meta.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "0.5rem 1.25rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          backgroundColor: "#F8FAFC" }}>
          <span style={{ fontSize: "0.68rem", color: T.muted }}>
            {auditRows.length} record{auditRows.length !== 1 ? "s" : ""} ·{" "}
            {serviceFilter === "ALL" ? "All services" : serviceOptions.find(o => o.code === serviceFilter)?.label}
          </span>
          <span style={{ fontSize: "0.68rem", color: T.muted }}>
            {selectedDate} · ISRO CMS Kitchen Production
          </span>
        </div>
      </div>
    </div>
  )
}
