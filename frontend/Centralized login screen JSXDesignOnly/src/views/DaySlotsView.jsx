export default function DaySlotsView() {
  const rows = [
    { code: "BF-A", service: "Breakfast", label: "Slot A", capacity: 120 },
    { code: "LN-A", service: "Lunch",     label: "Slot A", capacity: 200 },
    { code: "LN-B", service: "Lunch",     label: "Slot B", capacity: 180 },
    { code: "SN-A", service: "Snacks",    label: "Slot A", capacity: 80  },
    { code: "DN-A", service: "Dinner",    label: "Slot A", capacity: 60  },
  ]
  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F8FAFC",
      padding: "1.5rem", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "1.1rem" }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
          fontSize: "1rem", margin: 0, color: "#0F172A" }}>Day Slots</h2>
        <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.2rem 0 0" }}>
          Seating slots and capacity configuration per service
        </p>
      </div>
      <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "100px 140px 1fr 100px",
          padding: "0.55rem 1.1rem", borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
          {["Code", "Service", "Slot Label", "Capacity"].map(h => (
            <div key={h} style={{ fontSize: "0.68rem", fontWeight: 600, color: "#64748b",
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>
        {rows.map(r => (
          <div key={r.code} style={{ display: "grid", gridTemplateColumns: "100px 140px 1fr 100px",
            padding: "0.7rem 1.1rem", borderBottom: "1px solid #F1F5F9", alignItems: "center" }}>
            <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#64748b" }}>{r.code}</div>
            <div style={{ fontSize: "0.78rem", color: "#475569" }}>{r.service}</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "#0F172A" }}>{r.label}</div>
            <div style={{ fontSize: "0.78rem", color: "#475569" }}>{r.capacity}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
