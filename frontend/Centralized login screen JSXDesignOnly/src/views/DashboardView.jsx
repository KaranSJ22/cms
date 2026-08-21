import { useState } from "react"
import { T, NAV } from "../constants/tokens.js"
import { SEED_DATA, SEED_DAY_MENUS, SEED_WITHDRAWALS, ROLE_META } from "../constants/data.js"
import { Emblem } from "../components/icons/Icons.jsx"
import CanteenDashboardView from "./CanteenDashboardView.jsx"
import EmployeeHomeView from "./EmployeeHomeView.jsx"
import CatalogView from "./CatalogView.jsx"
import ServicesView from "./ServicesView.jsx"
import DaySlotsView from "./DaySlotsView.jsx"
import PricingView from "./PricingView.jsx"
import DayMenuView from "./DayMenuView.jsx"
import WalletView from "./WalletView.jsx"
import EmployeeWalletView from "./EmployeeWalletView.jsx"
import BookingsMonitorView from "./BookingsMonitorView.jsx"
import PreBookingView from "./PreBookingView.jsx"
import MyBookingsView from "./MyBookingsView.jsx"
import ReportsView from "./ReportsView.jsx"
import AccountView from "./AccountView.jsx"
import ProfileView from "./ProfileView.jsx"

export default function DashboardView({ user, onLogout }) {
  const { role } = user
  const isEmployee = role === "employee_permanent" || role === "employee_contract"
  const defaultTab = isEmployee ? "home" : "dashboard"
  const [tab, setTab] = useState(defaultTab)
  const [menuItems, setMenuItems] = useState(SEED_DATA)
  const [priceConfigs, setPriceConfigs] = useState([])
  const [dayMenus, setDayMenus] = useState(SEED_DAY_MENUS)
  const [withdrawals, setWithdrawals] = useState(SEED_WITHDRAWALS)
  const [topUps, setTopUps] = useState([])

  const pendingCount = dayMenus.filter(d => d.status === "PENDING").length
  const walletPendingCount = withdrawals.filter(w => w.status === "REQ").length

  const navGroups = isEmployee ? [
    { label: "", tabs: [
      { key: "home",           label: "Home" },
      { key: "prebooking",     label: "Pre-Booking" },
      { key: "mybookings",     label: "My Bookings" },
      { key: "history",        label: "Booking History" },
      ...(role === "employee_contract" ? [{ key: "wallet_employee", label: "Wallet" }] : []),
      { key: "profile",        label: "Profile" },
    ]},
  ] : role === "canteen_assistant" ? [
    { label: "", tabs: [
      { key: "dashboard",   label: "Dashboard" },
      { key: "catalog",     label: "Menu Items" },
      { key: "services",    label: "Services" },
      { key: "dayslots",    label: "Day Slots" },
      { key: "daymenu",     label: "Menu Planning", badge: pendingCount },
      { key: "bookings",    label: "Bookings" },
      { key: "kitchen",     label: "Kitchen" },
      { key: "account",     label: "Account" },
    ]},
  ] : [
    { label: "", tabs: [
      { key: "dashboard",   label: "Dashboard" },
      { key: "catalog",     label: "Menu Items" },
      { key: "services",    label: "Services" },
      { key: "dayslots",    label: "Day Slots" },
      { key: "daymenu",     label: "Menu Planning", badge: pendingCount },
      { key: "bookings",    label: "Bookings" },
      { key: "kitchen",     label: "Kitchen" },
      { key: "pricing",     label: "Pricing" },
      { key: "wallet",      label: "Wallet", badge: walletPendingCount },
      { key: "reports",     label: "Reports" },
      { key: "account",     label: "Account" },
    ]},
  ]

  const allTabs = navGroups.flatMap(g => g.tabs)

  const NavBtn = ({ k, label, badge }) => (
    <button key={k} onClick={() => setTab(k)}
      style={{ background: "transparent", border: "none", cursor: "pointer",
        padding: "0.3rem 0.8rem", borderRadius: 5, fontSize: "0.78rem", fontWeight: 500,
        color: tab === k ? T.saffron : NAV.muted,
        backgroundColor: tab === k ? "rgba(249,115,22,0.14)" : "transparent",
        transition: "all 0.12s", display: "flex", alignItems: "center", gap: "0.4rem",
        whiteSpace: "nowrap" }}
      onMouseEnter={e => { if (tab !== k) e.currentTarget.style.color = NAV.text }}
      onMouseLeave={e => { if (tab !== k) e.currentTarget.style.color = NAV.muted }}>
      {label}
      {badge != null && badge > 0 && (
        <span style={{ backgroundColor: T.saffron, color: "#0F172A", fontSize: "0.58rem",
          fontWeight: 700, borderRadius: 10, padding: "0.08rem 0.42rem", lineHeight: 1.5 }}>
          {badge}
        </span>
      )}
    </button>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh",
      backgroundColor: "#F8FAFC", fontFamily: "'Inter', sans-serif", color: T.white }}>

      <header style={{ height: 52, backgroundColor: NAV.bg, borderBottom: `1px solid ${NAV.border}`,
        display: "flex", alignItems: "center", padding: "0 1.5rem", gap: "1rem",
        flexShrink: 0, zIndex: 50 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexShrink: 0 }}>
          <Emblem size={26} />
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
              fontSize: "0.82rem", letterSpacing: "0.06em", color: NAV.text, lineHeight: 1 }}>
              CMS
            </div>
            <div style={{ fontSize: "0.6rem", color: NAV.muted, letterSpacing: "0.04em", lineHeight: 1, marginTop: "0.15rem" }}>
              Canteen Management
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 24, backgroundColor: NAV.border, flexShrink: 0 }} />

        {/* Nav tabs */}
        <nav style={{ display: "flex", gap: "0.1rem", flex: 1, overflow: "hidden" }}>
          {allTabs.map(({ key, label, badge }) => (
            <NavBtn key={key} k={key} label={label} badge={badge} />
          ))}
        </nav>

        {/* Right: user info + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "0.72rem", color: NAV.text, fontWeight: 600, lineHeight: 1.2 }}>
              {user.name}
            </span>
            <span style={{ fontSize: "0.6rem", color: NAV.muted, lineHeight: 1.2 }}>
              {ROLE_META[role].label} · {user.employeeId}
            </span>
          </div>
          <button onClick={onLogout}
            style={{ background: "transparent", border: `1px solid ${NAV.border}`,
              borderRadius: 5, padding: "0.28rem 0.7rem", color: NAV.muted,
              fontSize: "0.72rem", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = NAV.text }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = NAV.border; e.currentTarget.style.color = NAV.muted }}>
            Sign out
          </button>
        </div>
      </header>

      {tab === "dashboard"      && (isEmployee
        ? <EmployeeHomeView user={user} onNavigate={setTab} />
        : <CanteenDashboardView user={user} onNavigate={setTab} pendingMenus={pendingCount} pendingWithdrawals={walletPendingCount} />
      )}
      {tab === "home"           && <EmployeeHomeView user={user} onNavigate={setTab} />}
      {tab === "catalog"        && <CatalogView items={menuItems} setItems={setMenuItems} />}
      {tab === "services"       && <ServicesView />}
      {tab === "dayslots"       && <DaySlotsView />}
      {tab === "pricing"        && <PricingView menuItems={menuItems} configs={priceConfigs} setConfigs={setPriceConfigs} />}
      {tab === "daymenu"        && <DayMenuView menuItems={menuItems} entries={dayMenus} setEntries={setDayMenus} />}
      {tab === "wallet"         && <WalletView withdrawals={withdrawals} setWithdrawals={setWithdrawals} topUps={topUps} setTopUps={setTopUps} />}
      {tab === "wallet_employee" && <EmployeeWalletView user={user} />}
      {tab === "bookings"       && <BookingsMonitorView />}
      {tab === "kitchen"        && <BookingsMonitorView />}
      {tab === "prebooking"     && <PreBookingView />}
      {tab === "mybookings"     && <MyBookingsView user={user} />}
      {tab === "history"        && <MyBookingsView user={user} />}
      {tab === "reports"        && <ReportsView />}
      {tab === "account"        && <AccountView user={user} />}
      {tab === "profile"        && <ProfileView user={user} />}
    </div>
  )
}
