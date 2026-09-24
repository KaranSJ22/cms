import { DAY_FULL, DAY_SHORT } from '../../hooks/useBulkMenuPlanner';

/**
 * Modal to select a day to copy menu configuration from
 */
export default function CopyDayModal({
  activeDayIndex,
  weekDates = [],
  publishedDays = {},
  onCopy,
  onClose,
}) {
  const options = weekDates
    .map((date, i) => ({ i, date, isPublished: !!publishedDays[i] }))
    .filter(({ i }) => i !== activeDayIndex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-80 p-5">
        <h3 className="font-semibold text-slate-800 mb-1">Copy items from…</h3>
        <p className="text-xs text-slate-400 mb-4">
          Replace {DAY_FULL[activeDayIndex]}&apos;s items with a copy of another day&apos;s
          configuration.
        </p>
        <div className="space-y-1">
          {options.map(({ i, date, isPublished }) => (
            <button
              key={i}
              onClick={() => onCopy(i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-blue-50 transition-colors group cursor-pointer"
            >
              <span
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 group-hover:bg-blue-100'
                }`}
              >
                <span className="text-[10px] font-bold leading-none">
                  {DAY_SHORT[i]}
                </span>
                <span className="text-sm font-bold leading-tight">
                  {date.slice(8)}
                </span>
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {DAY_FULL[i]}
                  </span>
                  {isPublished && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      Published
                    </span>
                  )}
                </div>
                <span className="block text-xs text-slate-400">{date}</span>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
