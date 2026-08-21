export default function ReportsView() {
  const reports = [
    { title: "Daily Booking Summary",    desc: "Total bookings, served, cancelled, no-shows per day" },
    { title: "Monthly Utilization",      desc: "Service-wise utilization rates across a calendar month" },
    { title: "Item Consumption Report",  desc: "Quantity consumed per menu item per service" },
    { title: "Wallet Transactions",      desc: "Credit/debit history for all contract employees" },
    { title: "No-Show Analysis",         desc: "Employees with high no-show rates by period" },
  ]
  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F8FAFC",
      padding: "1.5rem", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "1.1rem" }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
          fontSize: "1rem", margin: 0, color: "#0F172A" }}>Reports</h2>
        <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.2rem 0 0" }}>
          Operational and financial reports for the canteen department
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {reports.map(r => (
          <div key={r.title} style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
            borderRadius: 7, padding: "1rem 1.1rem", display: "flex", alignItems: "center",
            justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#0F172A" }}>{r.title}</div>
              <div style={{ fontSize: "0.73rem", color: "#64748b", marginTop: "0.15rem" }}>{r.desc}</div>
            </div>
            <button style={{ background: "transparent", border: "1px solid #E2E8F0",
              borderRadius: 5, padding: "0.3rem 0.8rem", fontSize: "0.75rem",
              color: "#475569", cursor: "pointer" }}>
              Generate
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
