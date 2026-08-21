import { T, NAV } from "../constants/tokens.js"
import { ROLE_META, KITCHEN_PROD, AUDIT_BOOKINGS } from "../constants/data.js"

export default function CanteenDashboardView({ user, onNavigate, pendingMenus, pendingWithdrawals }) {
  const { role } = user
  const today = new Date("2026-08-13T00:00:00")
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const todayKey = "2026-08-11"
  const allTodayProd = (["BREAKFAST","LUNCH","SNACKS","DINNER"])
    .flatMap(s => KITCHEN_PROD[`${todayKey}_${s}`] ?? [])

  const totalPrepare  = allTodayProd.reduce((s, p) => s + p.toPrepare, 0)
  const totalServed   = allTodayProd.reduce((s, p) => s + p.served, 0)
  const totalNoShow   = allTodayProd.reduce((s, p) => s + p.noShow, 0)
  const totalRemaining = allTodayProd.reduce((s, p) => s + (p.toPrepare - p.served - p.partial - p.noShow), 0)
  const totalBookings = AUDIT_BOOKINGS.filter(b => b.bookedAt === todayKey).length

  const serviceCards = [
    { slot: "BREAKFAST", label: "Breakfast", time: "07:00 – 09:30", color: "#ea580c",
      bookings: AUDIT_BOOKINGS.filter(b => b.bookedAt === todayKey && b.service === "BREAKFAST").length,
      served:   (KITCHEN_PROD[`${todayKey}_BREAKFAST`] ?? []).reduce((s,p) => s+p.served,0),
      remaining:(KITCHEN_PROD[`${todayKey}_BREAKFAST`] ?? []).reduce((s,p) => s+(p.toPrepare-p.served-p.partial-p.noShow),0) },
    { slot: "LUNCH", label: "Lunch", time: "12:00 – 14:30", color: "#2563eb",
      bookings: AUDIT_BOOKINGS.filter(b => b.bookedAt === todayKey && b.service === "LUNCH").length,
      served:   (KITCHEN_PROD[`${todayKey}_LUNCH`] ?? []).reduce((s,p) => s+p.served,0),
      remaining:(KITCHEN_PROD[`${todayKey}_LUNCH`] ?? []).reduce((s,p) => s+(p.toPrepare-p.served-p.partial-p.noShow),0) },
    { slot: "SNACKS", label: "Snacks", time: "16:00 – 17:30", color: "#7c3aed",
      bookings: AUDIT_BOOKINGS.filter(b => b.bookedAt === todayKey && b.service === "SNACKS").length,
      served:   (KITCHEN_PROD[`${todayKey}_SNACKS`] ?? []).reduce((s,p) => s+p.served,0),
      remaining:(KITCHEN_PROD[`${todayKey}_SNACKS`] ?? []).reduce((s,p) => s+(p.toPrepare-p.served-p.partial-p.noShow),0) },
    { slot: "DINNER", label: "Dinner", time: "19:00 – 21:00", color: "#0f766e",
      bookings: AUDIT_BOOKINGS.filter(b => b.bookedAt === todayKey && b.service === "DINNER").length,
      served:   (KITCHEN_PROD[`${todayKey}_DINNER`] ?? []).reduce((s,p) => s+p.served,0),
      remaining:(KITCHEN_PROD[`${todayKey}_DINNER`] ?? []).reduce((s,p) => s+(p.toPrepare-p.served-p.partial-p.noShow),0) },
  ]

  const pendingActions = [
    ...(pendingMenus > 0 ? [{ label: `${pendingMenus} day menu ${pendingMenus === 1 ? "entry" : "entries"} awaiting approval`, tab: "daymenu", urgent: true }] : []),
    ...(pendingWithdrawals > 0 ? [{ label: `${pendingWithdrawals} wallet withdrawal ${pendingWithdrawals === 1 ? "request" : "requests"} pending`, tab: "wallet", urgent: false }] : []),
    { label: "Lunch menu not planned for next 3 days", tab: "daymenu", urgent: true },
    { label: "Breakfast pricing not set for Contract staff", tab: "pricing", urgent: false },
  ]

  const quickActions = role === "canteen_assistant" ? [
    { label: "View Today's Operations", tab: "bookings" },
  ] : [
    { label: "Plan Breakfast",           tab: "daymenu"  },
    { label: "Plan Lunch",               tab: "daymenu"  },
    { label: "Create Day Menu Entry",    tab: "daymenu"  },
    { label: "Add Menu Item",            tab: "catalog"  },
    { label: "View Today's Bookings",    tab: "bookings" },
    { label: "Manage Pricing",           tab: "pricing"  },
  ]

  const kpiRow = [
    { label: "Total Bookings",  value: totalBookings,  color: "#1e3a8a" },
    { label: "Items to Prepare",value: totalPrepare,   color: "#0F172A" },
    { label: "Served",          value: totalServed,    color: "#16a34a" },
    { label: "Remaining",       value: totalRemaining, color: T.saffron  },
    { label: "No-show",         value: totalNoShow,    color: "#64748b" },
  ]

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F8FAFC",
      padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem",
      fontFamily: "'Inter',sans-serif" }}>

      {/* Date banner */}
      <div style={{ backgroundColor: NAV.bg, borderRadius: 8, padding: "1rem 1.25rem",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
            fontSize: "1rem", color: "#FFFFFF" }}>
            {dateStr}
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginTop: "0.15rem" }}>
            ISRO Canteen · {ROLE_META[role].label}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {serviceCards.map(s => (
            <div key={s.slot} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: s.color, opacity: 0.8 }} />
          ))}
        </div>
      </div>

      {/* Service status tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
        {serviceCards.map(s => (
          <div key={s.slot} style={{ backgroundColor: "#FFFFFF", border: `1px solid #E2E8F0`,
            borderRadius: 7, padding: "1rem 1.1rem",
            borderLeft: `3px solid ${s.color}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "0.65rem" }}>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                fontSize: "0.78rem", color: s.color, letterSpacing: "0.03em" }}>
                {s.label.toUpperCase()}
              </span>
              <span style={{ fontSize: "0.62rem", color: "#94A3B8" }}>{s.time}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
              {[
                { label: "Booked",    value: s.bookings,  c: "#0F172A" },
                { label: "Served",    value: s.served,    c: "#16a34a" },
                { label: "Remaining", value: s.remaining, c: T.saffron  },
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                    fontSize: "1.15rem", color: stat.c, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: "0.58rem", color: "#94A3B8", marginTop: "0.15rem",
                    textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* KPI strip */}
      <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 7, padding: "0.85rem 1.25rem",
        display: "grid", gridTemplateColumns: "repeat(5,1fr)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {kpiRow.map((k, i) => (
          <div key={k.label} style={{ textAlign: "center", position: "relative" }}>
            {i > 0 && (
              <div style={{ position: "absolute", left: 0, top: "10%", bottom: "10%",
                width: 1, backgroundColor: "#E2E8F0" }} />
            )}
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "1.6rem", color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "0.25rem",
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1rem" }}>

        {/* Pending actions */}
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid #E2E8F0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            backgroundColor: "#F8FAFC" }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "0.82rem", color: "#0F172A" }}>Pending Actions</span>
            {pendingActions.length > 0 && (
              <span style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#dc2626",
                border: "1px solid rgba(220,38,38,0.18)", borderRadius: 10,
                fontSize: "0.62rem", fontWeight: 700, padding: "0.08rem 0.45rem" }}>
                {pendingActions.length}
              </span>
            )}
          </div>
          {pendingActions.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#94A3B8", fontSize: "0.8rem" }}>
              No pending actions.
            </div>
          ) : pendingActions.map((a, i) => (
            <div key={i}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.75rem 1.1rem",
                borderBottom: i < pendingActions.length - 1 ? "1px solid rgba(226,232,240,0.6)" : "none",
                cursor: "pointer", transition: "background-color 0.12s" }}
              onClick={() => onNavigate(a.tab)}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                backgroundColor: a.urgent ? "#dc2626" : T.saffron }} />
              <span style={{ flex: 1, fontSize: "0.78rem", color: "#0F172A" }}>{a.label}</span>
              <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>→</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC" }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "0.82rem", color: "#0F172A" }}>Quick Actions</span>
          </div>
          <div style={{ padding: "0.5rem 0.6rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => onNavigate(a.tab)}
                style={{ width: "100%", textAlign: "left", background: "transparent",
                  border: "1px solid #E2E8F0", borderRadius: 6,
                  padding: "0.55rem 0.85rem", color: "#0F172A",
                  fontSize: "0.78rem", cursor: "pointer", transition: "all 0.12s",
                  fontFamily: "'Inter',sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.saffron; e.currentTarget.style.backgroundColor = "rgba(249,115,22,0.04)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.backgroundColor = "transparent" }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu planning status */}
      <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
            fontSize: "0.82rem", color: "#0F172A" }}>Menu Planning Status</span>
          <button onClick={() => onNavigate("daymenu")}
            style={{ background: "transparent", border: "none", color: T.saffron,
              fontSize: "0.72rem", cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 600 }}>
            Open Planning →
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {[
            { service: "Breakfast", horizon: "7 days",  planned: 4, total: 7,  status: "In Progress" },
            { service: "Lunch",     horizon: "30 days", planned: 12, total: 30, status: "In Progress" },
            { service: "Snacks",    horizon: "Flexible", planned: 2, total: 7, status: "Partial" },
            { service: "Dinner",    horizon: "Flexible", planned: 3, total: 7, status: "Partial" },
          ].map((p, i) => {
            const pct = Math.round((p.planned / p.total) * 100)
            return (
              <div key={p.service}
                style={{ padding: "1rem 1.1rem",
                  borderRight: i < 3 ? "1px solid #E2E8F0" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "0.5rem" }}>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                    fontSize: "0.78rem", color: "#0F172A" }}>{p.service}</span>
                  <span style={{ fontSize: "0.62rem", color: "#64748b" }}>{p.horizon}</span>
                </div>
                <div style={{ height: 5, backgroundColor: "#F1F5F9", borderRadius: 3,
                  marginBottom: "0.5rem", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`,
                    backgroundColor: pct === 100 ? "#16a34a" : T.saffron,
                    borderRadius: 3, transition: "width 0.4s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{p.planned}/{p.total} days planned</span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600,
                    color: pct === 100 ? "#16a34a" : T.saffron }}>{p.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
