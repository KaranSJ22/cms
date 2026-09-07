import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { ROLE_META } from '../../utils/constants'
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'

export default function ISROHeader({ onToggleMobileSidebar, isMobileSidebarOpen }) {
  const { user, customer, logout, activeCanteenId, setActiveCanteenId } = useAuth()
  const perms = usePermissions()

  // Real-time IST Clock
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      // Format IST Time (HH:MM:SS)
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
      // Format Date (DD MMM YYYY)
      setDateStr(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      )
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const roleLabel = ROLE_META[perms.primaryRole]?.label ?? perms.primaryRole ?? 'Authorized User'
  const displayId = customer?.CUSTOMERID || user?.LOGINID || ''
  const canteenRoles = user?.CANTEENROLES || []

  return (
    <header className="relative bg-slate-900 border-b border-slate-800 text-white z-40 select-none shadow-sm">
      {/* ── Main Top Bar ── */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        
        {/* ── Left Branding Section ── */}
        <div className="flex items-center gap-3.5 flex-shrink-0 min-w-0">
          {/* Mobile Sidebar Toggle Button */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
            aria-label="Toggle navigation menu"
          >
            {isMobileSidebarOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>

          {/* Official ISRO Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="ISRO Logo"
              className="h-10 w-auto object-contain flex-shrink-0 drop-shadow-sm"
            />

            {/* Left Department Metadata */}
            <div className="hidden lg:flex flex-col">
              <span className="text-[0.62rem] font-semibold tracking-wider text-slate-300 uppercase leading-none">
                भारतीय अंतरिक्ष अनुसंधान संगठन
              </span>
              <span className="text-[0.72rem] font-bold tracking-tight text-white leading-tight mt-0.5">
                Indian Space Research Organisation
              </span>
              <span className="text-[0.6rem] font-medium tracking-wide text-orange-400 leading-none mt-0.5">
                Canteen Management System (CMS)
              </span>
            </div>
          </div>

          {/* Canteen Context Badge / Switcher (if multi-canteen) */}
          {canteenRoles.length > 1 && (
            <div className="hidden xl:flex items-center gap-1.5 ml-3 bg-slate-800/90 border border-slate-700/80 rounded px-2.5 py-1 text-[0.7rem] text-white">
              <BuildingOffice2Icon className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span className="text-slate-400 font-medium">Facility:</span>
              <select
                value={activeCanteenId || ''}
                onChange={(e) => setActiveCanteenId(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-[0.72rem]"
              >
                {canteenRoles.map((cr) => (
                  <option key={cr.CANTEENID} value={cr.CANTEENID} className="bg-slate-900 text-white">
                    {cr.CANTEENNAME || `Canteen #${cr.CANTEENID}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canteenRoles.length === 1 && (
            <div className="hidden xl:flex items-center gap-1.5 ml-3 bg-slate-800/60 border border-slate-700/50 rounded px-2 py-0.5 text-[0.68rem] text-slate-300">
              <BuildingOffice2Icon className="w-3 h-3 text-orange-400 flex-shrink-0" />
              <span className="text-slate-300 font-medium">{canteenRoles[0].CANTEENNAME || `Canteen #${canteenRoles[0].CANTEENID}`}</span>
            </div>
          )}
        </div>

        {/* ── Center Prominent ISRO HSFC Identity ── */}
        <div className="flex flex-col items-center justify-center text-center px-2 flex-1 md:flex-initial">
          {/* Top Hindi Line */}
          <div className="text-[0.68rem] md:text-[0.72rem] font-bold text-slate-300 tracking-[0.16em] uppercase leading-none">
            मानव अंतरिक्ष उड़ान केंद्र
          </div>

          {/* Main Bold Center Title */}
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="font-grotesk font-extrabold text-[0.95rem] md:text-[1.12rem] tracking-[0.12em] text-white leading-tight uppercase">
              ISRO — HSFC
            </h1>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
          </div>

          {/* Subtitle */}
          <div className="text-[0.58rem] md:text-[0.64rem] font-semibold text-slate-400 tracking-[0.18em] uppercase leading-none mt-0.5">
            Human Space Flight Centre · Bengaluru
          </div>
        </div>

        {/* ── Right Status, User Profile & Actions ── */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          {/* Real-time Indian Standard Time (IST) Clock */}
          <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-slate-950/60 border border-slate-800 rounded">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[0.72rem] font-bold text-white tracking-wider">
                {timeStr || '--:--:--'}
              </span>
              <span className="text-[0.58rem] font-semibold text-slate-400">IST</span>
            </div>
            <span className="text-[0.6rem] text-slate-400 mt-0.5 tracking-wide">
              {dateStr || 'Loading...'}
            </span>
          </div>

          {/* User Profile Summary */}
          <div className="hidden md:flex flex-col items-end leading-tight text-right">
            <div className="text-[0.75rem] font-semibold text-white truncate max-w-[140px] lg:max-w-[180px]">
              {user?.FULLNAME || 'Authenticated User'}
            </div>
            <div className="text-[0.62rem] text-slate-400 font-medium">
              <span className="text-orange-400 font-semibold">{roleLabel}</span>
              {displayId && <span className="text-slate-400"> · ID: {displayId}</span>}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={logout}
            title="Sign out of CMS"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 rounded px-2.5 py-1.5 text-[0.72rem] font-medium transition-colors duration-150"
          >
            <ArrowRightStartOnRectangleIcon className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

      </div>
    </header>
  )
}
