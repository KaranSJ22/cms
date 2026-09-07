import { useState } from 'react'
import { CATEGORY_LABELS } from '../../routes/routeConfig'
import { useAuth } from '../../hooks/useAuth'
import {
  Squares2X2Icon,
  TicketIcon,
  BookOpenIcon,
  RectangleStackIcon,
  ClockIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  QueueListIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  CurrencyRupeeIcon,
  WalletIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  HomeIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

// Icon mapping dictionary
const ICON_MAP = {
  Squares2X2Icon,
  TicketIcon,
  BookOpenIcon,
  RectangleStackIcon,
  ClockIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  QueueListIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  CurrencyRupeeIcon,
  WalletIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  HomeIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  CreditCardIcon,
}

export default function AppSidebar({
  tabs = [],
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) {
  const { activeCanteenId, setActiveCanteenId, user } = useAuth()
  const canteenRoles = user?.CANTEENROLES || []

  // Group tabs by category
  const groupedTabs = tabs.reduce((acc, tab) => {
    const cat = tab.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(tab)
    return acc
  }, {})

  const categoryOrder = ['operations', 'menu', 'terminals', 'finance', 'admin', 'employee', 'general']

  const renderNavGroup = (catKey, items) => {
    if (!items || items.length === 0) return null
    const groupLabel = CATEGORY_LABELS[catKey] || 'Navigation'

    return (
      <div key={catKey} className="py-2">
        {/* Category Header (Only when expanded) */}
        {!isCollapsed && (
          <div className="px-3 pb-1.5 text-[0.62rem] font-bold tracking-[0.14em] uppercase text-slate-400 select-none">
            {groupLabel}
          </div>
        )}

        {/* Links in Group */}
        <div className="space-y-0.5">
          {items.map((tab) => {
            const IconComponent = ICON_MAP[tab.icon] || Squares2X2Icon
            const isActive = activeTab === tab.key

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  onSelectTab(tab.key)
                  if (onCloseMobile) onCloseMobile()
                }}
                title={isCollapsed ? `${tab.label}${tab.badge > 0 ? ` (${tab.badge})` : ''}` : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-[0.78rem] font-medium
                  transition-all duration-150 relative group
                  ${isActive
                    ? 'bg-slate-800 text-white font-semibold border-l-4 border-orange-500 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-l-4 border-transparent'
                  }
                  ${isCollapsed ? 'justify-center px-0' : ''}
                `}
              >
                {/* Icon */}
                <IconComponent
                  className={`
                    w-5 h-5 flex-shrink-0 transition-colors
                    ${isActive ? 'text-orange-400' : 'text-slate-400 group-hover:text-slate-200'}
                  `}
                />

                {/* Tab Label (when expanded) */}
                {!isCollapsed && (
                  <span className="truncate flex-1 leading-tight">
                    {tab.label}
                  </span>
                )}

                {/* Numeric Alert Badge */}
                {tab.badge > 0 && (
                  <span
                    className={`
                      inline-flex items-center justify-center font-bold text-[0.62rem] leading-none rounded-full
                      bg-orange-500 text-slate-950 px-1.5 py-0.5 shadow-sm
                      ${isCollapsed ? 'absolute top-1 right-2 w-4 h-4 p-0 text-[0.58rem]' : ''}
                    `}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none">
      
      {/* ── Top Bar within Sidepanel (Controls) ── */}
      <div className={`flex items-center justify-between px-3 py-3 border-b border-slate-800/90 ${isCollapsed ? 'justify-center' : ''}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-[0.68rem] font-bold tracking-wider uppercase text-slate-300">
              CMS Navigation
            </span>
          </div>
        )}

        {/* Desktop Collapse / Expand Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidepanel (Ctrl+B)' : 'Collapse Sidepanel (Ctrl+B)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronDoubleRightIcon className="w-4 h-4" />
          ) : (
            <ChevronDoubleLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Canteen Selector in Sidebar (if multi-canteen and expanded) ── */}
      {canteenRoles.length > 1 && !isCollapsed && (
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/60">
          <label className="block text-[0.62rem] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Active Canteen Facility
          </label>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-white">
            <BuildingOffice2Icon className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            <select
              value={activeCanteenId || ''}
              onChange={(e) => setActiveCanteenId(Number(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs w-full"
            >
              {canteenRoles.map((cr) => (
                <option key={cr.CANTEENID} value={cr.CANTEENID} className="bg-slate-900 text-white">
                  {cr.CANTEENNAME || `Canteen #${cr.CANTEENID}`} ({cr.ROLECODE})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Scrollable Navigation Items ── */}
      <div className="flex-1 overflow-y-auto px-2 py-2 divide-y divide-slate-800/50 space-y-1">
        {categoryOrder.map((catKey) => renderNavGroup(catKey, groupedTabs[catKey]))}
      </div>

      {/* ── Sidebar Bottom Security / System Watermark ── */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-900/40">
        {!isCollapsed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[0.62rem] text-slate-400 font-semibold uppercase tracking-wider">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>ISRO-HSFC Intranet</span>
            </div>
            <div className="text-[0.58rem] text-slate-400">
              CMS Portal · v2.4 (High Reliability)
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="ISRO HSFC Intranet v2.4">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>

    </div>
  )

  return (
    <>
      {/* ── Desktop Fixed / Collapsible Sidebar ── */}
      <aside
        className={`
          hidden md:block flex-shrink-0 border-r border-slate-800 z-30 transition-all duration-200 ease-in-out
          ${isCollapsed ? 'w-18' : 'w-64'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Overlay Drawer ── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Body */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
