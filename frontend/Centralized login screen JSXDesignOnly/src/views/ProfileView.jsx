import { ROLE_META } from "../constants/data.js"

export default function ProfileView({ user }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F8FAFC",
      padding: "1.5rem", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ marginBottom: "1.1rem" }}>
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
          fontSize: "1rem", margin: 0, color: "#0F172A" }}>Profile</h2>
      </div>
      <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 7, padding: "1.25rem", maxWidth: 480,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {[
          ["Name",        user.name],
          ["Employee ID", user.employeeId],
          ["Type",        ROLE_META[user.role].label],
          ["Department",  user.dept],
          ["Login ID",    user.loginId],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", padding: "0.6rem 0",
            borderBottom: "1px solid #F1F5F9", gap: "1rem" }}>
            <div style={{ width: 120, fontSize: "0.73rem", color: "#64748b", fontWeight: 500,
              flexShrink: 0 }}>{label}</div>
            <div style={{ fontSize: "0.8rem", color: "#0F172A" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
