import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Emblem } from '../components/icons/Icons'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { getNavTabs, getDefaultTab } from '../routes/routeConfig'
import { ROLE_META } from '../utils/constants'
import { getDayMenus } from '../features/daymenu/api/daymenuApi'
import { fetchWithdrawals } from '../features/wallet/api/walletApi'

export default function AppLayout() {
  const { user, customer, logout } = useAuth()
  const perms    = usePermissions()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]             = useState(null)
  const [pendingMenus, setPendingMenus]       = useState(0)
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0)

  // Determine tabs first so we know which badges to fetch
  const tabs = getNavTabs(perms, user, customer, { pendingMenus, pendingWithdrawals })
  const hasDayMenuTab = tabs.some(t => t.badgeKey === 'pendingMenus')
  const hasWalletTab = tabs.some(t => t.badgeKey === 'pendingWithdrawals')

  // Load badge counts only if the user actually sees those tabs
  useEffect(() => {
    if (!hasDayMenuTab) return
    // Poll for pending menus
    getDayMenus({ APPRSTATUS: 'PENDING' })
      .then(data => setPendingMenus(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [hasDayMenuTab])

  useEffect(() => {
    if (!hasWalletTab) return
    fetchWithdrawals({ status: 'REQ' })
      .then(data => setPendingWithdrawals(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [hasWalletTab])

  // Set default tab once tabs are known
  useEffect(() => {
    if (tabs.length && !activeTab) setActiveTab(tabs[0].key)
  }, [tabs.length])

  function handleTab(key) {
    setActiveTab(key)
    navigate('/' + key)
  }

  const roleLabel = ROLE_META[perms.primaryRole]?.label ?? perms.primaryRole ?? ''
  const displayId = customer?.CUSTOMERID || user?.LOGINID || ''

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-inter">
      {/* ── Navigation Header ── */}
      <header className="h-[52px] flex items-center px-6 gap-4 flex-shrink-0 z-50 border-b"
        style={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.08)' }}>

        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Emblem size={26} />
          <div>
            <div className="font-grotesk font-bold text-[0.82rem] tracking-[0.06em] text-white leading-none">CMS</div>
            <div className="text-[0.6rem] leading-none mt-0.5 tracking-[0.04em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Canteen Management
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-6 flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

        {/* Nav tabs */}
        <nav className="flex gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
          {tabs.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => handleTab(key)}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded text-[0.78rem] font-medium
                whitespace-nowrap transition-all duration-150
                ${activeTab === key
                  ? 'text-orange-400 bg-orange-500/14'
                  : 'text-white/55 hover:text-white/90 bg-transparent'}
              `}
            >
              {label}
              {badge > 0 && (
                <span className="bg-orange-500 text-slate-900 text-[0.58rem] font-bold font-grotesk rounded-full px-1.5 py-0.5 leading-none">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User info + sign out */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[0.72rem] text-white font-semibold leading-tight">
              {user?.FULLNAME}
            </span>
            <span className="text-[0.6rem] leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {roleLabel}{displayId ? ` · ${displayId}` : ''}
            </span>
          </div>
          <button
            onClick={logout}
            className="border rounded text-[0.72rem] px-2.5 py-1.5 transition-all duration-150
              text-white/55 hover:text-white border-white/10 hover:border-white/30"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 flex flex-col min-h-0">
        <Outlet context={{ activeTab, setActiveTab: handleTab, pendingMenus, setPendingMenus }} />
      </main>
    </div>
  )
}
