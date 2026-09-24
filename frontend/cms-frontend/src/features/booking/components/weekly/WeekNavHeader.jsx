import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/**
 * Canteen selector & 7-Day Week Navigation Bar
 */
export default function WeekNavHeader({
  canteens = [],
  selectedCanteen,
  onCanteenChange,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  weekDates = [],
  maxWeeksAhead = 26,
}) {
  const startDisplay = weekDates[0]?.displayDate;
  const endDisplay = weekDates[6]?.displayDate;
  const yearText = weekDates[0]?.year
    ? `, ${
        weekDates[0]?.year === weekDates[6]?.year
          ? weekDates[0]?.year
          : `${weekDates[0]?.year} / ${weekDates[6]?.year}`
      }`
    : '';

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Canteen Selector */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Canteen
        </label>
        <select
          value={selectedCanteen}
          onChange={(e) => onCanteenChange(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
        >
          {canteens.map((c) => (
            <option key={c.CANTEENID} value={c.CANTEENID}>
              {c.CANTEENNAME}
            </option>
          ))}
        </select>
      </div>

      {/* Week Navigator (7 Days) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Target Week (7-Day Horizon)
        </label>
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={onPrevWeek}
            disabled={weekOffset === 0}
            className="p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          <div className="px-3.5 text-xs font-bold text-slate-800 flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
            <span>
              {startDisplay} – {endDisplay}
              {yearText}
            </span>
            {weekOffset === 0 ? (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded-md font-medium">
                This Week
              </span>
            ) : weekOffset === 1 ? (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-md font-bold flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" /> Next Week
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium">
                +{weekOffset} Wks
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onNextWeek}
            disabled={weekOffset >= maxWeeksAhead}
            className="p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title={
              weekOffset >= maxWeeksAhead
                ? 'Maximum advance horizon reached'
                : 'Next Week'
            }
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
