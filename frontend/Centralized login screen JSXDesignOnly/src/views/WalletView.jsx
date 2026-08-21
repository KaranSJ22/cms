import { useState } from "react"
import { T } from "../constants/tokens.js"
import { PAYMENT_METHODS, WITHDRAWAL_STATUS } from "../constants/data.js"
import { CloseIcon, WalletIcon } from "../components/icons/Icons.jsx"
import { WalletField, walletInputStyle, focusStyle, blurStyle } from "../components/ui/FormComponents.jsx"
import { Spinner } from "../components/icons/Icons.jsx"

export default function WalletView({ withdrawals, setWithdrawals, topUps, setTopUps }) {
  const [topUpForm, setTopUpForm] = useState({
    customerId: "", amount: "", method: "CASH",
    referenceNo: "", remarks: "",
  })
  const [topUpErrors, setTopUpErrors] = useState({})
  const [topUpSaving, setTopUpSaving] = useState(false)
  const [topUpSuccess, setTopUpSuccess] = useState(false)

  const [filterStatus, setFilterStatus] = useState("ALL")
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectRemarks, setRejectRemarks] = useState("")
  const [rejectSaving, setRejectSaving] = useState(false)

  const setField = (k, v) => {
    setTopUpForm(f => ({ ...f, [k]: v }))
    setTopUpErrors(e => ({ ...e, [k]: "" }))
  }

  const validateTopUp = () => {
    const e = {}
    if (!topUpForm.customerId.trim())              e.customerId = "Customer ID is required"
    if (!topUpForm.amount || isNaN(+topUpForm.amount) || +topUpForm.amount <= 0)
                                                    e.amount     = "Enter a valid positive amount"
    if (topUpForm.method !== "CASH" && !topUpForm.referenceNo.trim())
                                                    e.referenceNo = "Reference No required for this method"
    setTopUpErrors(e)
    return Object.keys(e).length === 0
  }

  const handleTopUp = (ev) => {
    ev.preventDefault()
    if (!validateTopUp()) return
    setTopUpSaving(true)
    setTimeout(() => {
      setTopUps(prev => [{
        id: Date.now(), ...topUpForm,
        createdAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      }, ...prev])
      setTopUpForm({ customerId: "", amount: "", method: "CASH", referenceNo: "", remarks: "" })
      setTopUpSaving(false)
      setTopUpSuccess(true)
      setTimeout(() => setTopUpSuccess(false), 2800)
    }, 700)
  }

  const handleApprove = (id) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: "COM", remarks: "Approved by cashier" } : w))
  }

  const handleReject = () => {
    if (!rejectRemarks.trim() || !rejectModal) return
    setRejectSaving(true)
    setTimeout(() => {
      setWithdrawals(prev => prev.map(w => w.id === rejectModal.id
        ? { ...w, status: "REJ", remarks: rejectRemarks } : w))
      setRejectModal(null)
      setRejectRemarks("")
      setRejectSaving(false)
    }, 500)
  }

  const filtered = withdrawals.filter(w => filterStatus === "ALL" || w.status === filterStatus)
  const pendingWithdrawals = withdrawals.filter(w => w.status === "REQ")

  return (
    <div style={{ flex: 1, display: "flex", gap: "1.5rem", padding: "1.5rem",
      overflowY: "auto", alignItems: "flex-start" }}>
      <style>{`
        select option { background-color: #112d52; }
        .wallet-input::placeholder { color: rgba(176,190,197,0.35) !important; }
      `}</style>

      {/* Left column: Top Up form */}
      <div style={{ width: 360, flexShrink: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {[
            { label: "Pending Withdrawals", value: pendingWithdrawals.length, color: "#facc15" },
            { label: "Top-Ups Today",        value: topUps.length,            color: T.saffron },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: T.card, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "0.7rem 1rem" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700,
                fontFamily: "'Space Grotesk',sans-serif", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.65rem", color: T.silver, marginTop: "0.1rem",
                textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`,
          borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "0.9rem 1.25rem", borderBottom: `1px solid ${T.border}`,
            backgroundColor: T.surface, display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8,
              backgroundColor: T.saffronDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <WalletIcon />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                fontSize: "0.88rem", color: T.white }}>Top Up Wallet</div>
              <div style={{ fontSize: "0.68rem", color: T.silver, marginTop: "0.1rem" }}>
                Credit balance to customer account
              </div>
            </div>
          </div>

          {topUpSuccess && (
            <div style={{ margin: "0.85rem 1.25rem 0", backgroundColor: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)", borderRadius: 7,
              padding: "0.6rem 0.85rem", display: "flex", alignItems: "center", gap: "0.5rem",
              animation: "fadeIn 0.2s ease" }}>
              <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <span style={{ fontSize: "0.9rem" }}>✓</span>
              <span style={{ fontSize: "0.78rem", color: "#4ade80", fontWeight: 600 }}>
                Wallet topped up successfully
              </span>
            </div>
          )}

          <form onSubmit={handleTopUp} style={{ padding: "1.1rem 1.25rem",
            display: "flex", flexDirection: "column", gap: "0.95rem" }}>

            <WalletField label="CUSTOMER ID" error={topUpErrors.customerId} required>
              <input className="wallet-input" type="text" value={topUpForm.customerId}
                onChange={e => setField("customerId", e.target.value)}
                placeholder="e.g. EMP-1042"
                style={walletInputStyle(!!topUpErrors.customerId)}
                onFocus={e => focusStyle(e.target, !!topUpErrors.customerId)}
                onBlur={e => blurStyle(e.target, !!topUpErrors.customerId)} />
            </WalletField>

            <WalletField label="AMOUNT (₹)" error={topUpErrors.amount} required>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "0.75rem", top: "50%",
                  transform: "translateY(-50%)", fontSize: "0.85rem",
                  color: T.silver, pointerEvents: "none" }}>₹</span>
                <input className="wallet-input" type="text" inputMode="decimal"
                  value={topUpForm.amount}
                  onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setField("amount", e.target.value) }}
                  placeholder="0.00"
                  style={{ ...walletInputStyle(!!topUpErrors.amount), paddingLeft: "1.75rem", textAlign: "right", fontFamily: "monospace", fontSize: "0.9rem" }}
                  onFocus={e => focusStyle(e.target, !!topUpErrors.amount)}
                  onBlur={e => blurStyle(e.target, !!topUpErrors.amount)} />
              </div>
            </WalletField>

            <WalletField label="PAYMENT METHOD" required>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {PAYMENT_METHODS.map(pm => {
                  const sel = topUpForm.method === pm.code
                  return (
                    <button key={pm.code} type="button"
                      onClick={() => setField("method", pm.code)}
                      style={{ padding: "0.3rem 0.6rem", borderRadius: 6, fontSize: "0.72rem",
                        fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                        backgroundColor: sel ? T.saffronDim : "transparent",
                        color: sel ? T.saffron : T.silver,
                        borderColor: sel ? T.saffron : T.border }}>
                      {pm.label}
                    </button>
                  )
                })}
              </div>
            </WalletField>

            <WalletField label="REFERENCE NO"
              error={topUpErrors.referenceNo}
              required={topUpForm.method !== "CASH"}
              hint={topUpForm.method === "CASH" ? "Optional for cash transactions" : "Required for this payment method"}>
              <input className="wallet-input" type="text" value={topUpForm.referenceNo}
                onChange={e => setField("referenceNo", e.target.value)}
                placeholder="UTR / Cheque / TXN number"
                style={walletInputStyle(!!topUpErrors.referenceNo)}
                onFocus={e => focusStyle(e.target, !!topUpErrors.referenceNo)}
                onBlur={e => blurStyle(e.target, !!topUpErrors.referenceNo)} />
            </WalletField>

            <WalletField label="REMARKS">
              <textarea className="wallet-input" value={topUpForm.remarks}
                onChange={e => setField("remarks", e.target.value)}
                placeholder="Optional notes for this transaction…"
                rows={2}
                style={{ ...walletInputStyle(false), resize: "none", lineHeight: 1.5, fontFamily: "'Inter',sans-serif" }} />
            </WalletField>

            <button type="submit" disabled={topUpSaving}
              style={{ backgroundColor: topUpSaving ? "rgba(255,153,51,0.5)" : T.saffron,
                color: "#0F172A", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                fontSize: "0.875rem", border: "none", borderRadius: 8,
                padding: "0.75rem", cursor: topUpSaving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                boxShadow: topUpSaving ? "none" : "0 3px 14px rgba(255,153,51,0.3)",
                transition: "background-color 0.2s, transform 0.1s" }}
              onMouseEnter={e => { if (!topUpSaving) { e.currentTarget.style.backgroundColor = "#ffaa44"; e.currentTarget.style.transform = "translateY(-1px)" } }}
              onMouseLeave={e => { if (!topUpSaving) { e.currentTarget.style.backgroundColor = T.saffron; e.currentTarget.style.transform = "translateY(0)" } }}>
              {topUpSaving ? <><Spinner />Processing…</> : <><WalletIcon size={15} color={T.navy} />Top Up Wallet</>}
            </button>
          </form>
        </div>

        {topUps.length > 0 && (
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`,
            borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "0.7rem 1.1rem", borderBottom: `1px solid ${T.border}`,
              backgroundColor: T.surface, fontSize: "0.75rem", fontWeight: 600,
              color: T.silver, fontFamily: "'Space Grotesk',sans-serif",
              letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Recent Top-Ups
            </div>
            {topUps.slice(0, 5).map((r, i) => (
              <div key={r.id} style={{ padding: "0.6rem 1.1rem",
                borderBottom: i < Math.min(topUps.length, 5) - 1 ? `1px solid rgba(0,0,0,0.04)` : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: T.white, fontWeight: 500 }}>{r.customerId}</div>
                  <div style={{ fontSize: "0.68rem", color: T.muted }}>{r.method} · {r.createdAt}</div>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: "0.88rem",
                  fontWeight: 700, color: "#4ade80" }}>+ ₹{r.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right column: Withdrawal Requests table */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "1rem",
              fontWeight: 700, margin: 0, color: T.white }}>Withdrawal Requests</h2>
            <p style={{ fontSize: "0.75rem", color: T.silver, margin: "0.2rem 0 0" }}>
              Review and process customer withdrawal requests
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {(["ALL", "REQ", "COM", "REJ", "CAN"]).map(s => {
              const active = filterStatus === s
              const meta = s !== "ALL" ? WITHDRAWAL_STATUS[s] : null
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ padding: "0.3rem 0.7rem", borderRadius: 20, fontSize: "0.72rem",
                    fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                    backgroundColor: active ? (meta ? meta.bg : T.saffronDim) : "transparent",
                    color: active ? (meta ? meta.text : T.saffron) : T.silver,
                    borderColor: active ? (meta ? meta.border : T.saffron) : T.border }}>
                  {s === "ALL" ? "All" : s}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`,
          borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "grid",
            gridTemplateColumns: "130px 160px 110px 90px 1fr 200px",
            padding: "0 1.25rem", borderBottom: `1px solid ${T.border}`,
            backgroundColor: T.surface }}>
            {["Customer ID", "Name", "Amount", "Status", "Requested At", "Actions"].map(h => (
              <div key={h} style={{ padding: "0.6rem 0", fontSize: "0.65rem", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase", color: T.silver,
                fontFamily: "'Space Grotesk',sans-serif" }}>{h}</div>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {filtered.length === 0
              ? <div style={{ padding: "2.5rem", textAlign: "center", color: T.silver, fontSize: "0.82rem" }}>
                  No withdrawal requests for this filter.
                </div>
              : filtered.map((w, idx) => {
                const meta = WITHDRAWAL_STATUS[w.status]
                const isPending = w.status === "REQ"
                return (
                  <div key={w.id}
                    style={{ display: "grid",
                      gridTemplateColumns: "130px 160px 110px 90px 1fr 200px",
                      padding: "0 1.25rem", alignItems: "center",
                      backgroundColor: idx % 2 === 0 ? "rgba(0,0,0,0.018)" : "transparent",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      transition: "background-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.surface)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "rgba(0,0,0,0.018)" : "transparent")}>

                    <div style={{ padding: "0.75rem 0", fontFamily: "monospace",
                      fontSize: "0.78rem", color: T.saffron, letterSpacing: "0.04em" }}>
                      {w.customerId}
                    </div>
                    <div style={{ padding: "0.75rem 0", fontSize: "0.82rem", color: T.white, fontWeight: 500 }}>
                      {w.customerName}
                    </div>
                    <div style={{ padding: "0.75rem 0", fontFamily: "monospace",
                      fontSize: "0.88rem", fontWeight: 700, color: T.white }}>
                      ₹ {w.amount}
                    </div>
                    <div style={{ padding: "0.75rem 0" }}>
                      <span style={{ padding: "0.2rem 0.55rem", borderRadius: 20,
                        fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em",
                        fontFamily: "'Space Grotesk',sans-serif",
                        backgroundColor: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}>
                        {w.status}
                      </span>
                    </div>
                    <div style={{ padding: "0.75rem 0", fontSize: "0.75rem", color: T.silver }}>
                      {w.requestedAt}
                      {w.remarks && (
                        <div style={{ fontSize: "0.68rem", color: T.muted, marginTop: "0.15rem",
                          maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {w.remarks}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "0.75rem 0", display: "flex", gap: "0.45rem" }}>
                      {isPending ? (
                        <>
                          <button onClick={() => handleApprove(w.id)}
                            style={{ padding: "0.35rem 0.75rem", borderRadius: 6, border: "none",
                              backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80",
                              fontSize: "0.73rem", fontWeight: 700, cursor: "pointer",
                              fontFamily: "'Space Grotesk',sans-serif",
                              display: "flex", alignItems: "center", gap: "0.3rem",
                              transition: "background-color 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.28)")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.15)")}>
                            ✓ Approve
                          </button>
                          <button onClick={() => { setRejectModal(w); setRejectRemarks("") }}
                            style={{ padding: "0.35rem 0.75rem", borderRadius: 6, border: "none",
                              backgroundColor: "rgba(239,68,68,0.13)", color: "#f87171",
                              fontSize: "0.73rem", fontWeight: 700, cursor: "pointer",
                              fontFamily: "'Space Grotesk',sans-serif",
                              display: "flex", alignItems: "center", gap: "0.3rem",
                              transition: "background-color 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.25)")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.13)")}>
                            ✕ Reject
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: T.muted, fontStyle: "italic" }}>
                          {w.status === "COM" ? "Completed" : w.status === "REJ" ? "Rejected" : "Cancelled"}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, padding: "0.5rem 1.25rem",
            fontSize: "0.72rem", color: T.muted, display: "flex", justifyContent: "space-between" }}>
            <span>{filtered.length} requests · {withdrawals.filter(w => w.status === "REQ").length} pending</span>
            <span>Wallet Management · ISRO CMS</span>
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          animation: "fadeIn 0.15s ease-out" }}>
          <div style={{ width: "100%", maxWidth: 400, backgroundColor: T.card,
            border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden" }}>

            <div style={{ padding: "1rem 1.4rem", borderBottom: `1px solid ${T.border}`,
              backgroundColor: "rgba(239,68,68,0.07)",
              display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                backgroundColor: "rgba(239,68,68,0.15)", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#f87171", fontSize: "0.9rem", fontWeight: 700 }}>✕</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                  fontSize: "0.95rem", color: "#f87171" }}>Reject Withdrawal</div>
                <div style={{ fontSize: "0.72rem", color: T.silver, marginTop: "0.15rem" }}>
                  {rejectModal.customerId} · ₹ {rejectModal.amount}
                </div>
              </div>
              <button onClick={() => setRejectModal(null)}
                style={{ background: "transparent", border: "none", color: T.silver,
                  cursor: "pointer", borderRadius: 6, display: "flex", padding: "0.2rem",
                  transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = T.white)}
                onMouseLeave={e => (e.currentTarget.style.color = T.silver)}>
                <CloseIcon />
              </button>
            </div>

            <div style={{ padding: "1.1rem 1.4rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.68rem",
                fontWeight: 600, letterSpacing: "0.1em", color: T.saffron, textTransform: "uppercase",
                display: "flex", gap: "0.3rem" }}>
                REMARKS <span style={{ color: "#f87171" }}>*</span>
              </label>
              <textarea value={rejectRemarks} onChange={e => setRejectRemarks(e.target.value)}
                placeholder="State reason for rejection…" rows={3}
                style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 7, padding: "0.65rem 0.85rem", color: T.white,
                  fontSize: "0.82rem", outline: "none", resize: "none",
                  fontFamily: "'Inter',sans-serif", lineHeight: 1.5,
                  transition: "border-color 0.2s, box-shadow 0.2s" }}
                onFocus={e => { e.target.style.borderColor = "#f87171"; e.target.style.boxShadow = "0 0 0 3px rgba(248,113,113,0.1)" }}
                onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none" }} />
              {!rejectRemarks.trim() && (
                <span style={{ fontSize: "0.7rem", color: "#f87171" }}>Reason is required</span>
              )}
            </div>

            <div style={{ padding: "0.85rem 1.4rem", borderTop: `1px solid ${T.border}`,
              display: "flex", gap: "0.65rem" }}>
              <button onClick={() => setRejectModal(null)}
                style={{ flex: 1, backgroundColor: "transparent", border: `1px solid ${T.border}`,
                  borderRadius: 7, color: T.silver, fontSize: "0.85rem", fontWeight: 600,
                  fontFamily: "'Space Grotesk',sans-serif", padding: "0.6rem", cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.white }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.silver }}>
                Cancel
              </button>
              <button disabled={rejectSaving || !rejectRemarks.trim()} onClick={handleReject}
                style={{ flex: 2, border: "none", borderRadius: 7,
                  fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
                  padding: "0.6rem", cursor: "pointer",
                  backgroundColor: rejectSaving ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.2)",
                  color: "#f87171",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                  opacity: !rejectRemarks.trim() ? 0.5 : 1,
                  transition: "background-color 0.2s" }}
                onMouseEnter={e => { if (!rejectSaving && rejectRemarks.trim()) e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.32)" }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.2)" }}>
                {rejectSaving ? <><Spinner color="#f87171" />Rejecting…</> : "✕ Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
