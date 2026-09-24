import { DAY_SHORT } from '../../hooks/useBulkMenuPlanner';

/**
 * 7-Day Tab strip (Mon–Sun) with status pills for Published, Holiday, and Item count
 */
export default function WeekDayTabBar({
  weekDates = [],
  activeDayIndex,
  onSelectDay,
  holidayMap = {},
  holidayOverrides = {},
  publishedDays = {},
  daySummary = [],
}) {
  return (
    <div className="border-b border-slate-100 px-4 pt-3 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {Array.from({ length: 7 }, (_, i) => {
          const date = weekDates[i] || `Day ${i + 1}`;
          const isHoliday = date && holidayMap[date];
          const isPublished = !!publishedDays[i];
          const isWeekend = i === 5 || i === 6;
          const count = daySummary[i];
          const isActive = activeDayIndex === i;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(i)}
              className={`relative flex flex-col items-center px-4 py-2.5 rounded-t-xl border-b-2 transition-all text-center min-w-[84px] cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/70 font-bold'
                  : isHoliday
                  ? 'border-transparent text-rose-600 hover:text-rose-800 hover:bg-rose-50/50'
                  : isPublished
                  ? 'border-transparent text-emerald-700 hover:bg-emerald-50/50'
                  : isWeekend
                  ? 'border-transparent text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold">{DAY_SHORT[i]}</span>
                {isWeekend && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 leading-none">
                    W/E
                  </span>
                )}
              </div>
              <span className="text-sm font-bold">
                {date.slice(8) || `${i + 1}`}
              </span>
              {isHoliday ? (
                <span
                  className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight ${
                    holidayOverrides[i]
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                  title={holidayMap[date]}
                >
                  {holidayOverrides[i] ? 'Holiday (Open)' : 'Holiday'}
                </span>
              ) : isPublished ? (
                <span className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 tracking-tight flex items-center gap-0.5">
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Published
                </span>
              ) : count > 0 ? (
                <span
                  className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              ) : (
                <span className="mt-0.5 text-[10px] text-slate-300">—</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
