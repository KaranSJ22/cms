import { T, NAV } from "../constants/tokens.js"
import { ROLE_META, AUDIT_BOOKINGS, PREBOOK_MENUS, DAY_SLOTS, BOOKING_STATUS_META } from "../constants/data.js"

export default function EmployeeHomeView({ user, onNavigate }) {
  const today = new Date("2026-08-13T00:00:00")
  const dateStr = today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const myRecentBookings = AUDIT_BOOKINGS.filter(b => b.customerId === user.employeeId).slice(0, 5)

  const tomorrowMenus = PREBOOK_MENUS.map(m => ({
    slot: m.slot,
    item: m.items[0],
    price: m.price,
    slotDef: DAY_SLOTS.find(s => s.code === m.slot),
  }))

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F8FAFC",
      padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem",
      fontFamily: "'Inter',sans-serif" }}>

      {/* Welcome */}
      <div style={{ backgroundColor: NAV.bg, borderRadius: 8, padding: "1.1rem 1.25rem",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
            fontSize: "0.95rem", color: "#FFFFFF" }}>
            Good morning, {user.name}
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginTop: "0.15rem" }}>
            {dateStr} · {user.employeeId} · {ROLE_META[user.role].label}
          </div>
        </div>
        <button onClick={() => onNavigate("prebooking")}
          style={{ backgroundColor: T.saffron, border: "none", borderRadius: 6,
            padding: "0.52rem 1.1rem", color: "#0F172A",
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "0.8rem",
            cursor: "pointer", boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
            transition: "background-color 0.15s" }}>
          Book Meals →
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1rem" }}>

        {/* Tomorrow's menu */}
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "0.82rem", color: "#0F172A" }}>
              Tomorrow's Menu
            </span>
            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
              {new Date("2026-08-14T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
          {tomorrowMenus.map((m, idx) => (
            <div key={m.slot}
              style={{ display: "flex", alignItems: "center", gap: "0.85rem",
                padding: "0.8rem 1.1rem",
                borderBottom: idx < tomorrowMenus.length - 1 ? "1px solid rgba(226,232,240,0.55)" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 5, flexShrink: 0,
                backgroundColor: `${m.slotDef.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem" }}>
                {m.slotDef.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", color: "#0F172A", fontWeight: 500 }}>{m.item.name}</div>
                <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "0.05rem",
                  fontFamily: "monospace" }}>{m.item.code}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                  fontSize: "0.85rem", color: "#0F172A" }}>₹{m.price}</div>
                <div style={{ fontSize: "0.6rem", color: "#94A3B8", marginTop: "0.05rem" }}>per portion</div>
              </div>
              <button onClick={() => onNavigate("prebooking")}
                style={{ background: "transparent", border: "1px solid #E2E8F0",
                  borderRadius: 5, padding: "0.28rem 0.6rem", color: "#64748b",
                  fontSize: "0.7rem", cursor: "pointer", transition: "all 0.12s",
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.saffron; e.currentTarget.style.color = T.saffron }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748b" }}>
                Book
              </button>
            </div>
          ))}
        </div>

        {/* My recent bookings */}
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "0.82rem", color: "#0F172A" }}>Recent Bookings</span>
            <button onClick={() => onNavigate("mybookings")}
              style={{ background: "transparent", border: "none", color: T.saffron,
                fontSize: "0.7rem", cursor: "pointer",
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>
              View all →
            </button>
          </div>
          {myRecentBookings.map((b, idx) => {
            const meta = BOOKING_STATUS_META[b.status]
            return (
              <div key={b.id}
                style={{ padding: "0.7rem 1.1rem",
                  borderBottom: idx < myRecentBookings.length - 1 ? "1px solid rgba(226,232,240,0.55)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "0.2rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#0F172A", fontWeight: 500 }}>{b.itemName}</span>
                  <span style={{ padding: "0.12rem 0.5rem", borderRadius: 10, fontSize: "0.62rem",
                    fontWeight: 600, backgroundColor: meta.bg, color: meta.text,
                    border: `1px solid ${meta.border}` }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ fontSize: "0.65rem", color: "#94A3B8" }}>
                  {b.service} · {b.bookedAt}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
