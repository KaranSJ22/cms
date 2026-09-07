import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { getNavTabs } from '../routes/routeConfig'
import { getPendingDayMenus } from '../features/daymenu/api/daymenuApi'
import { fetchWithdrawals } from '../features/wallet/api/walletApi'
import ISROHeader from '../components/layout/ISROHeader'
import AppSidebar from '../components/layout/AppSidebar'

export default function AppLayout() {
  const { user, customer } = useAuth()
  const perms = usePermissions()
  const navigate = useNavigate()
  const location = useLocation()

  const [pendingMenus, setPendingMenus] = useState(0)
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0)

  // Sidebar collapse state (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('isro_cms_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Determine tabs first so we know which badges to fetch
  const tabs = getNavTabs(perms, user, customer, { pendingMenus, pendingWithdrawals })
  const hasDayMenuTab = tabs.some((t) => t.badgeKey === 'pendingMenus')
  const hasWalletTab = tabs.some((t) => t.badgeKey === 'pendingWithdrawals')

  const currentPath = location.pathname.replace(/^\//, '')
  const activeTab = currentPath || tabs[0]?.key || ''

  // Load badge counts only if the user actually sees those tabs
  useEffect(() => {
    if (!hasDayMenuTab) return
    getPendingDayMenus()
      .then((data) => setPendingMenus(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [hasDayMenuTab])

  useEffect(() => {
    if (!hasWalletTab) return
    fetchWithdrawals({ status: 'REQ' })
      .then((data) => setPendingWithdrawals(Array.isArray(data) ? data.length : 0))
      .catch(() => {})
  }, [hasWalletTab])

  const handleTab = useCallback(
    (key) => {
      navigate('/' + key)
      setIsMobileSidebarOpen(false)
    },
    [navigate]
  )

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('isro_cms_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }, [])

  // Keyboard shortcut (Ctrl+B) to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleSidebarCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebarCollapse])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-inter text-slate-900">
      {/* ── ISRO HSFC Top Header ── */}
      <ISROHeader
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* ── App Body (Sidepanel + Main Content Area) ── */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
        {/* ── Left Sidepanel (Navigation) ── */}
        <AppSidebar
          tabs={tabs}
          activeTab={activeTab}
          onSelectTab={handleTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* ── Main Viewport Content ── */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-50 overflow-y-auto">
          <Outlet
            context={{
              activeTab,
              setActiveTab: handleTab,
              pendingMenus,
              setPendingMenus,
            }}
          />
        </main>
      </div>
    </div>
  )
}
