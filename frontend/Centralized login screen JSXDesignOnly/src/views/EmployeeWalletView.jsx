import { CONTRACT_WALLET_BALANCE, CONTRACT_WALLET_TRANSACTIONS } from "../constants/data.js"

export default function EmployeeWalletView({ user }) {
  const balance = CONTRACT_WALLET_BALANCE
  const txns = CONTRACT_WALLET_TRANSACTIONS

  const totalCredit = txns.filter(t => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0)
  const totalDebit  = txns.filter(t => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0)

  const colGrid = "130px 70px 80px 1fr 150px 120px"

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F8FAFC",
      padding: "1.5rem", fontFamily: "'Inter',sans-serif", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      <div>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
          fontSize: "1rem", margin: 0, color: "#0F172A" }}>My Wallet</h2>
        <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.2rem 0 0" }}>
          {user.employeeId} · {user.name}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
        {[
          { label: "Current Balance", value: `₹${balance.toFixed(2)}`, color: "#0F172A", highlight: true },
          { label: "Total Credits",   value: `₹${totalCredit.toFixed(2)}`, color: "#16a34a", highlight: false },
          { label: "Total Debits",    value: `₹${totalDebit.toFixed(2)}`,  color: "#dc2626", highlight: false },
        ].map(card => (
          <div key={card.label} style={{ backgroundColor: "#FFFFFF", border: `1px solid #E2E8F0`,
            borderRadius: 7, padding: "1rem 1.1rem",
            boxShadow: card.highlight ? "0 2px 8px rgba(15,23,42,0.08)" : "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.35rem" }}>
              {card.label}
            </div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "1.35rem", color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 7, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600,
            fontSize: "0.82rem", color: "#0F172A" }}>Transaction History</span>
          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{txns.length} records</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: colGrid, padding: "0.55rem 1.1rem",
          borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
          {["Date", "Type", "Amount", "Description", "Reference", "Booking No"].map(h => (
            <div key={h} style={{ fontSize: "0.68rem", fontWeight: 600, color: "#64748b",
              textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {txns.map(t => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: colGrid,
            padding: "0.7rem 1.1rem", borderBottom: "1px solid #F1F5F9",
            alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "#475569" }}>{t.date}</div>
            <div>
              <span style={{
                fontSize: "0.68rem", fontWeight: 600, borderRadius: 4, padding: "0.12rem 0.5rem",
                backgroundColor: t.type === "CREDIT" ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.09)",
                color: t.type === "CREDIT" ? "#16a34a" : "#dc2626",
                border: `1px solid ${t.type === "CREDIT" ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.2)"}`,
              }}>
                {t.type}
              </span>
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600,
              color: t.type === "CREDIT" ? "#16a34a" : "#dc2626" }}>
              {t.type === "CREDIT" ? "+" : "−"}₹{t.amount.toFixed(2)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#475569" }}>{t.description}</div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "monospace" }}>{t.reference}</div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "monospace" }}>
              {t.bookingNo ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
