export default function ServicesView() {
  const rows = [
    { code: "BREAKFAST", label: "Breakfast", time: "07:00 – 09:30", status: "Active" },
    { code: "LUNCH",     label: "Lunch",     time: "12:00 – 14:30", status: "Active" },
    { code: "SNACKS",    label: "Snacks",    time: "16:00 – 17:30", status: "Active" },
    { code: "DINNER",    label: "Dinner",    time: "19:00 – 21:00", status: "Active" },
  ]
  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F8FAFC",
      padding: "1.5rem", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "1.1rem" }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
          fontSize: "1rem", margin: 0, color: "#0F172A" }}>Services</h2>
        <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.2rem 0 0" }}>
          Canteen service definitions and operating windows
        </p>
      </div>
      <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 160px 100px",
          padding: "0.55rem 1.1rem", borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
          {["Code", "Label", "Time Window", "Status"].map(h => (
            <div key={h} style={{ fontSize: "0.68rem", fontWeight: 600, color: "#64748b",
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>
        {rows.map(r => (
          <div key={r.code} style={{ display: "grid", gridTemplateColumns: "100px 1fr 160px 100px",
            padding: "0.7rem 1.1rem", borderBottom: "1px solid #F1F5F9", alignItems: "center" }}>
            <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#64748b" }}>{r.code}</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "#0F172A" }}>{r.label}</div>
            <div style={{ fontSize: "0.78rem", color: "#475569" }}>{r.time}</div>
            <div>
              <span style={{ fontSize: "0.68rem", fontWeight: 600, borderRadius: 4, padding: "0.12rem 0.5rem",
                backgroundColor: "rgba(22,163,74,0.10)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.25)" }}>
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
