import { useState } from "react"
import { T, NAV } from "../constants/tokens.js"
import { DEMO_USERS } from "../constants/data.js"
import { Emblem, Spinner } from "../components/icons/Icons.jsx"
import { FormField } from "../components/ui/FormComponents.jsx"
import { PrimaryBtn } from "../components/ui/Buttons.jsx"

export default function LoginView({ onLogin }) {
  const [hovering, setHovering] = useState(false)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }
  const mask = `radial-gradient(circle at ${cursor.x}px ${cursor.y}px, #000 72px, transparent 140px)`

  const handleLogin = (e) => {
    e.preventDefault()
    setError("")
    const found = DEMO_USERS.find(u => u.loginId === loginId.trim().toLowerCase() && u.password === password)
    if (!found) { setError("Invalid login ID or password."); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const { password: _pw, ...user } = found
      onLogin(user)
    }, 700)
  }

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden",
      backgroundColor: NAV.bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif" }}
      onPointerEnter={() => setHovering(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHovering(false)}>
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at center,rgba(0,0,0,0.04) 1.2px,transparent 1.4px)",
        backgroundSize: "22px 22px" }} />
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at center,rgba(249,115,22,0.28) 2.2px,transparent 2.5px)",
        backgroundSize: "22px 22px", opacity: hovering ? 1 : 0,
        maskImage: mask, WebkitMaskImage: mask, transition: "opacity 0.2s ease" }} />
      <div style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(249,115,22,0.1) 0%,transparent 70%)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420,
        margin: "0 1.5rem", backgroundColor: T.card, border: `1px solid ${T.border}`,
        borderRadius: 16, boxShadow: "0 12px 48px rgba(0,0,0,0.18),0 0 0 1px rgba(249,115,22,0.08)",
        padding: "2.5rem 2.25rem 2.25rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Emblem size={56} />
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1.3rem",
            fontWeight: 700, color: T.white, letterSpacing: "0.04em", margin: "1rem 0 0" }}>
            CMS PORTAL
          </h1>
          <p style={{ fontSize: "0.75rem", color: T.silver, marginTop: "0.3rem",
            letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Canteen Management System
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <FormField id="loginid" label="LOGINID" type="text" value={loginId}
            onChange={setLoginId} placeholder="Enter your login ID" autoComplete="username" />
          <FormField id="password" label="PASSWORD" type="password" value={password}
            onChange={setPassword} placeholder="Enter your password" autoComplete="current-password" />
          <div style={{ textAlign: "right", marginTop: "-0.6rem" }}>
            <a href="#" style={{ fontSize: "0.75rem", color: T.silver, textDecoration: "none" }}
              onMouseEnter={e => (e.target.style.color = T.saffron)}
              onMouseLeave={e => (e.target.style.color = T.silver)}>
              Forgot password?
            </a>
          </div>
          {error && (
            <div style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: 7, padding: "0.55rem 0.85rem", fontSize: "0.78rem", color: "#dc2626",
              display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ flexShrink: 0 }}>✕</span>{error}
            </div>
          )}
          <PrimaryBtn type="submit" loading={loading}>
            {loading ? <><Spinner />Authenticating…</> : "Login"}
          </PrimaryBtn>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.65rem", color: T.muted,
          marginTop: "1.75rem", letterSpacing: "0.04em", borderTop: `1px solid ${T.border}`,
          paddingTop: "1rem" }}>
          ISRO · Canteen Management System · v1.0
        </p>
        <p style={{ textAlign: "center", fontSize: "0.62rem", color: T.muted,
          marginTop: "0.35rem", letterSpacing: "0.02em" }}>
          Demo: manager · assistant · employee · contract
        </p>
      </div>
    </div>
  )
}
