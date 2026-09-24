import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { getServiceEmoji } from "../../../../utils/serviceEmoji";

export default function MenuMonitorFilterBar({
  canteens = [],
  selectedCanteen,
  setSelectedCanteen,
  weekDates = [],
  weekOffset,
  setWeekOffset,
  searchQuery,
  setSearchQuery,
  services = [],
  selectedServiceId,
  setSelectedServiceId,
  currentServiceIndex,
  activeService,
  getServiceLiveCount,
  getServiceDishCount,
  metrics,
}) {
  return (
    <div className="space-y-4">
      {/* ── Tier 1: Workspace Controls (Canteen, Week, Search) ──────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Canteen Selector (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Catering Facility
            </label>
            <select
              value={selectedCanteen}
              onChange={(e) => setSelectedCanteen(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer"
            >
              {canteens.map((c) => (
                <option key={c.CANTEENID} value={c.CANTEENID}>
                  {c.CANTEENNAME} ({c.CANTEENCODE})
                </option>
              ))}
            </select>
          </div>

          {/* Week Horizon Navigator (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Target Horizon (7-Day Scope)
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 justify-between">
              <button
                type="button"
                onClick={() => setWeekOffset((p) => p - 1)}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                title="Previous Week"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black text-slate-800 tracking-tight whitespace-nowrap">
                  {weekDates[0]?.displayDate} – {weekDates[6]?.displayDate}, 2026
                </span>
                {weekOffset === 0 ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                    This Week
                  </span>
                ) : weekOffset === 1 ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                    Next Week
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setWeekOffset((p) => p + 1)}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                title="Next Week"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dish Search Filter (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Filter Dish by Name / Code
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish name or code..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tier 2: Dedicated Interactive Service Tabs Strip ───────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Select Meal Service to Inspect Across 7 Days:
            </h2>
          </div>
          {services.length > 0 && (
            <span className="text-[11px] font-bold text-slate-400">
              Service {currentServiceIndex + 1} of {services.length}
            </span>
          )}
        </div>

        {/* Scrollable / Responsive Service Pill Buttons */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {services.map((s) => {
            const isSelected = String(s.SERVICEID) === String(selectedServiceId);
            const liveCount = getServiceLiveCount(s.SERVICEID);
            const dishCount = getServiceDishCount(s.SERVICEID);
            const emoji = getServiceEmoji(s.SERVNAME);
            const start = s.DEFSTART?.substring(0, 5) || "08:00";
            const end = s.DEFEND?.substring(0, 5) || "10:00";

            return (
              <button
                key={s.SERVICEID}
                type="button"
                onClick={() => setSelectedServiceId(String(s.SERVICEID))}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[#0F172A] text-white shadow-md ring-2 ring-orange-500/50"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <span className="text-base leading-none">{emoji}</span>
                <div className="text-left">
                  <span className="block font-black leading-tight tracking-wide">{s.SERVNAME}</span>
                  <span
                    className={`text-[10px] font-mono leading-tight ${
                      isSelected ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {start}–{end}
                  </span>
                </div>

                <div className="ml-1 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : liveCount > 0
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {liveCount} live
                  </span>
                  {dishCount > 0 && (
                    <span
                      className={`text-[10px] font-medium hidden sm:inline ${
                        isSelected ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      ({dishCount} dishes)
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tier 3: Sleek KPI Summary Strip ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <span>Active Service:</span>
          <span className="font-black text-slate-900">{activeService?.SERVNAME}</span>
          <span className="text-slate-400 font-mono">
            ({activeService?.DEFSTART?.substring(0, 5)}–{activeService?.DEFEND?.substring(0, 5)})
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Live Slots:</span>
            <span className="font-extrabold text-slate-900 font-mono">
              {getServiceLiveCount(activeService?.SERVICEID)} of 7 Days
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Dishes in Service:</span>
            <span className="font-extrabold text-orange-600 font-mono">
              {getServiceDishCount(activeService?.SERVICEID)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <span className="text-slate-500">Week Total Dishes:</span>
            <span className="font-extrabold text-slate-900 font-mono">
              {metrics.totalItemsScheduled}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Holidays:</span>
            <span
              className={`font-extrabold font-mono ${
                metrics.holidaysCount > 0 ? "text-rose-600" : "text-slate-600"
              }`}
            >
              {metrics.holidaysCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
