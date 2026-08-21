import { AUDIT_BOOKINGS, BOOKING_STATUS_META } from "../constants/data.js"

export default function MyBookingsView({ user }) {
  const myBookings = AUDIT_BOOKINGS.filter(b => b.customerId === user.employeeId)
  const colGrid = "170px 90px 1fr 120px"

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F8FAFC",
      padding: "1.5rem", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
          fontSize: "1rem", margin: 0, color: "#0F172A" }}>My Bookings</h2>
        <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0" }}>
          All meal bookings for {user.employeeId} · {user.name}
        </p>
      </div>

      <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: colGrid,
          padding: "0 1.1rem", borderBottom: "1px solid #E2E8F0",
          backgroundColor: "#F8FAFC" }}>
          {["Booking No", "Date", "Item", "Status"].map(h => (
            <div key={h} style={{ padding: "0.55rem 0", fontSize: "0.62rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b",
              fontFamily: "'Space Grotesk',sans-serif" }}>{h}</div>
          ))}
        </div>
        {myBookings.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#94A3B8", fontSize: "0.8rem" }}>
            No bookings found.
          </div>
        ) : myBookings.map((b, idx) => {
          const meta = BOOKING_STATUS_META[b.status]
          const even = idx % 2 === 0
          return (
            <div key={b.id}
              style={{ display: "grid", gridTemplateColumns: colGrid,
                padding: "0 1.1rem", alignItems: "center",
                backgroundColor: even ? "rgba(248,250,252,0.5)" : "#FFFFFF",
                borderBottom: idx < myBookings.length - 1 ? "1px solid rgba(226,232,240,0.5)" : "none",
                transition: "background-color 0.1s" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = even ? "rgba(248,250,252,0.5)" : "#FFFFFF")}>
              <div style={{ padding: "0.7rem 0", fontFamily: "monospace",
                fontSize: "0.72rem", color: "#1e3a8a", fontWeight: 600 }}>{b.bookingNo}</div>
              <div style={{ padding: "0.7rem 0", fontSize: "0.75rem", color: "#0F172A" }}>{b.bookedAt}</div>
              <div style={{ padding: "0.7rem 0" }}>
                <div style={{ fontSize: "0.78rem", color: "#0F172A", fontWeight: 500 }}>{b.itemName}</div>
                <div style={{ fontSize: "0.65rem", color: "#94A3B8", marginTop: "0.05rem" }}>{b.service}</div>
              </div>
              <div style={{ padding: "0.7rem 0" }}>
                <span style={{ padding: "0.18rem 0.55rem", borderRadius: 10, fontSize: "0.65rem",
                  fontWeight: 600, backgroundColor: meta.bg, color: meta.text,
                  border: `1px solid ${meta.border}` }}>
                  {meta.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
