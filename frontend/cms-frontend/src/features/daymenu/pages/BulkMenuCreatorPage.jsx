import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useBulkMenu } from '../hooks/useBulkMenu'
import { getActiveCanteens } from '../../dayslot/api/daySlotsApi'
import { getServices } from '../../services/api/servicesApi'
import { getMenuItems } from '../../menu/api/menuApi'
import { holidayApi } from '../../holidays/api/holidayApi'

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(dateStr, d) {
  const [y, m, dayNum] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, dayNum + d))
  return dt.toISOString().slice(0, 10)
}

function formatLocalISO(servDate, startTime, offsetHours = 1) {
  if (!servDate || !startTime) return ''
  const [y, m, d] = servDate.split('-').map(Number)
  const timeParts = startTime.split(':').map(Number)
  const hours = (timeParts[0] || 0) - offsetHours
  const minutes = timeParts[1] || 0
  
  // Date computed in UTC to ensure an accurate, timezone-safe ISO-8601 string
  const dt = new Date(Date.UTC(y, m - 1, d, hours, minutes, 0))
  return dt.toISOString()
}

function defaultBookUntil(servDate, startTime) {
  return formatLocalISO(servDate, startTime, 1)
}

function defaultCancelUntil(servDate, startTime) {
  return formatLocalISO(servDate, startTime, 1)
}

function makeDefaultItemConfig(menuItemId, servDate, startTime) {
  return {
    MENUITEMID:   menuItemId,
    ISBASE:       1,
    ISSPECIAL:    0,
    ISPREBOOK:    1,
    ISKIOSK:      1,
    MAXQTY:       1,
    AVAILQTY:     null,
    BOOKUNTIL:    servDate && startTime ? defaultBookUntil(servDate, startTime) : '',
    CANCELUNTIL:  servDate && startTime ? defaultCancelUntil(servDate, startTime) : '',
  }
}

/** Build a fresh 5-day state: Map<dayIndex, Map<MENUITEMID, config>> */
function buildEmptyWeek() {
  return Array.from({ length: 5 }, () => ({}))
}

const DAY_SHORT  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DAY_FULL   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ isNewSlot }) {
  return isNewSlot ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      New Slot
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      Updated
    </span>
  )
}

function ItemConfigRow({ item, config, onUpdateFlag, onUpdateQty, onRemove }) {
  const flags = [
    { key: 'ISBASE',    label: 'Base'     },
    { key: 'ISSPECIAL', label: 'Special'  },
    { key: 'ISPREBOOK', label: 'Pre-book' },
    { key: 'ISKIOSK',   label: 'Kiosk'   },
  ]
  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors group">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-800 text-sm truncate">{item.ITEMNAME}</span>
        <button
          onClick={() => onRemove(item.MENUITEMID)}
          className="shrink-0 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {flags.map(({ key, label }) => {
          const active = config[key] === 1
          return (
            <button
              key={key}
              onClick={() => onUpdateFlag(item.MENUITEMID, key, active ? 0 : 1)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
              }`}
            >
              {label}
            </button>
          )
        })}
        <div className="flex items-center gap-1.5 ml-auto">
          <label className="text-xs text-slate-400">Max</label>
          <input
            type="number" min={1} value={config.MAXQTY}
            onChange={e => onUpdateQty(item.MENUITEMID, 'MAXQTY', parseInt(e.target.value) || 1)}
            className="w-14 px-2 py-0.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
          />
          <label className="text-xs text-slate-400">Avail</label>
          <input
            type="number" min={0} placeholder="∞"
            value={config.AVAILQTY ?? ''}
            onChange={e => onUpdateQty(item.MENUITEMID, 'AVAILQTY', e.target.value === '' ? null : parseInt(e.target.value))}
            className="w-14 px-2 py-0.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

// ── Copy-from-day modal ───────────────────────────────────────────────────────

function CopyFromModal({ activeDayIndex, weekDates, onCopy, onClose }) {
  const options = weekDates
    .map((date, i) => ({ i, date }))
    .filter(({ i }) => i !== activeDayIndex)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-80 p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Copy items from…</h3>
        <p className="text-xs text-slate-400 mb-4">Replace {DAY_FULL[activeDayIndex]}'s items with a copy of another day's configuration.</p>
        <div className="space-y-1">
          {options.map(({ i, date }) => (
            <button
              key={i}
              onClick={() => onCopy(i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-blue-50 transition-colors group"
            >
              <span className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex flex-col items-center justify-center shrink-0 transition-colors">
                <span className="text-[10px] font-bold text-slate-500 leading-none">{DAY_SHORT[i]}</span>
                <span className="text-sm font-bold text-slate-700 leading-tight">{date.slice(8)}</span>
              </span>
              <div>
                <span className="text-sm font-medium text-slate-700">{DAY_FULL[i]}</span>
                <span className="block text-xs text-slate-400">{date}</span>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BulkMenuCreatorPage() {
  const { user } = useAuth()
  const { loading, error, results, submitBulkMenu, reset } = useBulkMenu()

  // Reference data
  const [canteens, setCanteens]     = useState([])
  const [services, setServices]     = useState([])
  const [menuItems, setMenuItems]   = useState([])
  const [holidays, setHolidays]     = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  // Context form
  const [canteenId, setCanteenId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime]     = useState('10:00')

  // Per-day item state: array of 7 objects { [MENUITEMID]: config }
  const [weekItems, setWeekItems] = useState(buildEmptyWeek)

  // UI state
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const [itemSearch, setItemSearch]         = useState('')
  const [showCopyModal, setShowCopyModal]   = useState(false)

  // ── Load reference data ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setDataLoading(true)
      try {
        const [canteenData, serviceData, itemData, holidayData] = await Promise.all([
          getActiveCanteens(),
          getServices(),
          getMenuItems(),
          holidayApi.getHolidays({ year: new Date().getFullYear() }).catch(() => ({ data: [] })),
        ])
        const userCanteenIds = (user?.CANTEENROLES || []).map(r => r.CANTEENID)
        const hasAdmin = (user?.SYSTEMROLES || []).includes('SYSADM')
        const filtered = hasAdmin
          ? (canteenData || [])
          : (canteenData || []).filter(c => userCanteenIds.includes(c.CANTEENID))
        setCanteens(filtered)
        setServices((serviceData || []).filter(s => s.STATUSCODE === 'ACT'))
        setMenuItems((itemData || []).filter(m => m.STATUSCODE === 'ACT'))
        const hList = holidayData?.data?.DATA || holidayData?.data || holidayData?.DATA || []
        setHolidays(Array.isArray(hList) ? hList : [])
      } catch (e) {
        console.error('Failed to load reference data', e)
      } finally {
        setDataLoading(false)
      }
    }
    load()
  }, [user])

  // ── Derived state ─────────────────────────────────────────────────────────
  const weekDates = useMemo(() =>
    startDate ? Array.from({ length: 5 }, (_, i) => addDays(startDate, i)) : [],
    [startDate]
  )

  const holidayMap = useMemo(() => {
    const map = {}
    holidays.forEach(h => {
      if (h.HOLIDAYDATE) {
        const dateStr = typeof h.HOLIDAYDATE === 'string' ? h.HOLIDAYDATE.slice(0, 10) : ''
        if (dateStr) map[dateStr] = h.HOLIDAYNAME
      }
    })
    return map
  }, [holidays])

  const activeDayMap = weekItems[activeDayIndex] // { [MENUITEMID]: config }

  const selectedIds = Object.keys(activeDayMap).map(Number)

  const filteredCatalog = useMemo(() => {
    const q = itemSearch.toLowerCase()
    return menuItems.filter(m =>
      !activeDayMap[m.MENUITEMID] &&
      (m.ITEMNAME?.toLowerCase().includes(q) || m.MENUCODE?.toLowerCase().includes(q))
    )
  }, [menuItems, activeDayMap, itemSearch])

  const selectedItemsList = menuItems.filter(m => !!activeDayMap[m.MENUITEMID])

  const daySummary = weekItems.map(dayMap => Object.keys(dayMap).length)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const addItem = useCallback((menuItem) => {
    const servDate = weekDates[activeDayIndex] || startDate
    setWeekItems(prev => {
      const copy = [...prev]
      copy[activeDayIndex] = {
        ...copy[activeDayIndex],
        [menuItem.MENUITEMID]: makeDefaultItemConfig(menuItem.MENUITEMID, servDate, startTime),
      }
      return copy
    })
  }, [activeDayIndex, weekDates, startDate, startTime])

  const removeItem = useCallback((menuItemId) => {
    setWeekItems(prev => {
      const copy = [...prev]
      const dayMap = { ...copy[activeDayIndex] }
      delete dayMap[menuItemId]
      copy[activeDayIndex] = dayMap
      return copy
    })
  }, [activeDayIndex])

  const updateFlag = useCallback((menuItemId, field, value) => {
    setWeekItems(prev => {
      const copy = [...prev]
      copy[activeDayIndex] = {
        ...copy[activeDayIndex],
        [menuItemId]: { ...copy[activeDayIndex][menuItemId], [field]: value },
      }
      return copy
    })
  }, [activeDayIndex])

  const updateQty = useCallback((menuItemId, field, value) => {
    setWeekItems(prev => {
      const copy = [...prev]
      copy[activeDayIndex] = {
        ...copy[activeDayIndex],
        [menuItemId]: { ...copy[activeDayIndex][menuItemId], [field]: value },
      }
      return copy
    })
  }, [activeDayIndex])

  // Apply all items to all 5 days (quick-fill, automatically skipping holidays and adjusting dates)
  const applyToAllDays = () => {
    const source = weekItems[activeDayIndex]
    setWeekItems(prev => prev.map((_, i) => {
      if (i === activeDayIndex) return prev[i]
      const targetDate = weekDates[i]
      if (targetDate && holidayMap[targetDate]) {
        // Automatically skip holidays during quick-fill
        return {}
      }
      const cloned = {}
      Object.entries(source).forEach(([menuItemId, cfg]) => {
        cloned[menuItemId] = {
          ...cfg,
          BOOKUNTIL: targetDate && startTime ? defaultBookUntil(targetDate, startTime) : '',
          CANCELUNTIL: targetDate && startTime ? defaultCancelUntil(targetDate, startTime) : '',
        }
      })
      return cloned
    }))
  }

  // Copy from a specific day index into the active day
  const copyFromDay = (sourceIndex) => {
    const source = weekItems[sourceIndex]
    const targetDate = weekDates[activeDayIndex]
    setWeekItems(prev => {
      const copy = [...prev]
      const cloned = {}
      Object.entries(source).forEach(([menuItemId, cfg]) => {
        cloned[menuItemId] = {
          ...cfg,
          BOOKUNTIL: targetDate && startTime ? defaultBookUntil(targetDate, startTime) : '',
          CANCELUNTIL: targetDate && startTime ? defaultCancelUntil(targetDate, startTime) : '',
        }
      })
      copy[activeDayIndex] = cloned
      return copy
    })
    setShowCopyModal(false)
  }

  const clearDay = () => {
    setWeekItems(prev => {
      const copy = [...prev]
      copy[activeDayIndex] = {}
      return copy
    })
  }

  const handleSubmit = async () => {
    if (!canteenId || !serviceId || !startDate || !startTime || !endTime) {
      alert('Please fill in all context fields.')
      return
    }

    // Build DAYS payload: 5 objects (Monday to Friday), each with DAYINDEX + ITEMS
    // Recalculates BOOKUNTIL and CANCELUNTIL for each specific day's date
    const days = weekItems.map((dayMap, idx) => {
      const targetDate = weekDates[idx] || startDate
      return {
        DAYINDEX: idx,
        ITEMS: Object.values(dayMap).map(cfg => ({
          ...cfg,
          BOOKUNTIL:   defaultBookUntil(targetDate, startTime),
          CANCELUNTIL: defaultCancelUntil(targetDate, startTime),
        })),
      }
    })

    await submitBulkMenu({
      CANTEENID: Number(canteenId),
      SERVICEID: Number(serviceId),
      STARTDATE: startDate,
      STARTTIME: startTime,
      ENDTIME:   endTime,
      DAYS:      days,
    })
  }

  const handleReset = () => {
    reset()
    setCanteenId(''); setServiceId(''); setStartDate('')
    setStartTime('08:00'); setEndTime('10:00')
    setWeekItems(buildEmptyWeek())
    setActiveDayIndex(0); setItemSearch('')
  }

  const totalItemDays = daySummary.filter(n => n > 0).length
  const isReady = canteenId && serviceId && startDate && startTime && endTime && totalItemDays > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Copy modal */}
      {showCopyModal && weekDates.length === 5 && (
        <CopyFromModal
          activeDayIndex={activeDayIndex}
          weekDates={weekDates}
          onCopy={copyFromDay}
          onClose={() => setShowCopyModal(false)}
        />
      )}

      {/* ── Header ── */}
      <div className="bg-[#0F172A] rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Bulk Menu Creator (Mon – Fri)</h1>
            </div>
            <p className="text-blue-100/60 text-sm max-w-xl">
              Configure items for Monday through Friday (5 days). Any holidays in between are automatically skipped.
            </p>
          </div>
          {results && (
            <button onClick={handleReset} className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/20 transition-colors">
              + New Batch
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <svg className="mt-0.5 shrink-0 w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="font-semibold text-rose-800 text-sm">Bulk creation failed</p>
            <p className="text-rose-700 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Success ── */}
      {results && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </span>
            <div>
              <h2 className="font-semibold text-emerald-800">Bulk Creation Successful</h2>
              <p className="text-emerald-700 text-sm">
                {results.filter(r => !r.skipped && r.isNewSlot).length} new slots · {results.filter(r => !r.skipped && !r.isNewSlot).length} updated · {results.filter(r => r.skipped).length} skipped
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Day</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Slot No.</th>
                  <th className="px-5 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600">Items</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={row.date} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${row.skipped ? 'opacity-40' : ''}`}>
                    <td className="px-5 py-3 font-medium text-slate-700">{DAY_FULL[i]}</td>
                    <td className="px-5 py-3 text-slate-600">{row.date}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.slotNo ?? '—'}</td>
                    <td className="px-5 py-3">
                      {row.skipped
                        ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.reason?.startsWith('Holiday')
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {row.reason || 'Skipped'}
                          </span>
                        )
                        : <StatusBadge isNewSlot={row.isNewSlot} />
                      }
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!row.skipped && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">{row.itemsInserted}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!results && (
        <>
          {/* ── Step 1: Context ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <h2 className="font-semibold text-slate-800">Canteen, Service &amp; Week</h2>
            </div>
            <div className="p-6">
              {dataLoading ? (
                <div className="flex items-center gap-3 text-slate-500 text-sm py-4">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                  Loading reference data…
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Canteen</label>
                    <select id="bulk-canteen" value={canteenId} onChange={e => setCanteenId(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow">
                      <option value="">Select Canteen</option>
                      {canteens.map(c => <option key={c.CANTEENID} value={c.CANTEENID}>{c.CANTEENNAME}</option>)}
                    </select>
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Service</label>
                    <select id="bulk-service" value={serviceId} onChange={e => setServiceId(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow">
                      <option value="">Select Service</option>
                      {services.map(s => <option key={s.SERVICEID} value={s.SERVICEID}>{s.SERVNAME}</option>)}
                    </select>
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Date (Day 1)</label>
                    <input id="bulk-startdate" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setWeekItems(buildEmptyWeek()) }} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="lg:col-span-1 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start</label>
                      <input id="bulk-starttime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">End</label>
                      <input id="bulk-endtime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Step 2: Day tabs + Items ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <h2 className="font-semibold text-slate-800">Configure Menu Per Day (Mon – Fri)</h2>
              <span className="ml-auto text-xs text-slate-400">
                {totalItemDays} of 5 days configured
              </span>
            </div>

            {/* Day selector tabs */}
            <div className="border-b border-slate-100 px-4 pt-3 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {Array.from({ length: 5 }, (_, i) => {
                  const date = weekDates[i] || `Day ${i + 1}`
                  const isHoliday = date && holidayMap[date]
                  const count = daySummary[i]
                  const isActive = activeDayIndex === i
                  return (
                    <button
                      key={i}
                      onClick={() => { setActiveDayIndex(i); setItemSearch('') }}
                      className={`relative flex flex-col items-center px-4 py-2.5 rounded-t-xl border-b-2 transition-all text-center min-w-[76px] ${
                        isActive
                          ? 'border-blue-600 text-blue-700 bg-blue-50/70'
                          : isHoliday
                          ? 'border-transparent text-rose-600 hover:text-rose-800 hover:bg-rose-50/50'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-semibold">{DAY_SHORT[i]}</span>
                      <span className="text-sm font-bold">{date.slice(8) || `${i + 1}`}</span>
                      {isHoliday ? (
                        <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 tracking-tight" title={holidayMap[date]}>
                          Holiday
                        </span>
                      ) : count > 0 ? (
                        <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>{count}</span>
                      ) : (
                        <span className="mt-0.5 text-[10px] text-slate-300">—</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Day action bar */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 flex-wrap">
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-xs font-semibold text-slate-600">
                  {weekDates[activeDayIndex]
                    ? `${DAY_FULL[activeDayIndex]} — ${weekDates[activeDayIndex]}`
                    : `${DAY_FULL[activeDayIndex]} (set start date first)`}
                </span>
                {holidayMap[weekDates[activeDayIndex]] && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-md border border-rose-200">
                    🏖️ Holiday: {holidayMap[weekDates[activeDayIndex]]}
                  </span>
                )}
              </div>
              {daySummary[activeDayIndex] > 0 && (
                <>
                  <button
                    onClick={applyToAllDays}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                    title="Copy this day's items to all other days"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Apply to all days
                  </button>
                  <button
                    onClick={clearDay}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Clear day
                  </button>
                </>
              )}
              <button
                onClick={() => setShowCopyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Copy from…
              </button>
            </div>

            {/* Two-column: catalog + configured */}
            <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-slate-100">

              {/* Catalog */}
              <div className="flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      id="bulk-item-search"
                      type="text"
                      placeholder="Search catalog…"
                      value={itemSearch}
                      onChange={e => setItemSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-72 divide-y divide-slate-50">
                  {filteredCatalog.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      {itemSearch ? 'No matches.' : selectedIds.length === menuItems.length ? 'All items selected.' : 'No active items.'}
                    </div>
                  ) : filteredCatalog.map(item => (
                    <button
                      key={item.MENUITEMID}
                      onClick={() => addItem(item)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors group"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-slate-800 truncate">{item.ITEMNAME}</span>
                        <span className="text-xs text-slate-400">{item.MENUCODE}</span>
                      </span>
                      <span className="shrink-0 opacity-0 group-hover:opacity-100 text-xs font-semibold text-blue-600 flex items-center gap-1 transition-opacity">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configured items for active day */}
              <div className="flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {DAY_SHORT[activeDayIndex]} — {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} configured
                  </span>
                </div>
                <div className="overflow-y-auto max-h-72 p-3 space-y-2">
                  {selectedItemsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-slate-400 text-sm text-center py-8">
                      <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      <p>Click items from the catalog to add them to {DAY_SHORT[activeDayIndex]}.</p>
                    </div>
                  ) : selectedItemsList.map(item => (
                    <ItemConfigRow
                      key={item.MENUITEMID}
                      item={item}
                      config={activeDayMap[item.MENUITEMID]}
                      onUpdateFlag={updateFlag}
                      onUpdateQty={updateQty}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Week Overview strip ── */}
          {weekDates.length === 7 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Week Overview</p>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((date, i) => {
                  const count = daySummary[i]
                  const isActive = activeDayIndex === i
                  return (
                    <button
                      key={date}
                      onClick={() => setActiveDayIndex(i)}
                      className={`flex flex-col items-center py-3 rounded-xl border text-center transition-all ${
                        isActive
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                          : count > 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-semibold opacity-75">{DAY_SHORT[i]}</span>
                      <span className="text-sm font-bold mt-0.5">{date.slice(8)}</span>
                      <span className={`mt-1 text-[10px] font-semibold ${isActive ? 'text-white/70' : count > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {count > 0 ? `${count} item${count !== 1 ? 's' : ''}` : 'empty'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Submit bar ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-slate-600">
                {isReady
                  ? `Ready — ${totalItemDays} day${totalItemDays !== 1 ? 's' : ''} configured, ${7 - totalItemDays} will be skipped`
                  : 'Fill context and configure items for at least one day'}
              </span>
            </div>
            <button
              id="bulk-submit-btn"
              onClick={handleSubmit}
              disabled={!isReady || loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />Creating…</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Create Bulk Menu</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
