import { DAY_FULL, DAY_SHORT } from '../../hooks/useBulkMenuPlanner';

/**
 * Modal to select a day to copy menu configuration from
 */
export default function CopyDayModal({
  activeDayIndex,
  weekDates = [],
  publishedDays = {},
  daySummary = [],
  onCopy,
  onClose,
}) {
  const options = Array.from({ length: 7 }, (_, i) => {
    const date = weekDates[i] || '';
    const isPublished = Boolean(publishedDays[i]);
    const count = daySummary[i] || 0;
    return { i, date, count, isPublished };
  }).filter(({ i }) => i !== activeDayIndex);

  const availableWithItems = options.filter((o) => o.count > 0 || o.isPublished);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-bold text-slate-800 text-base">Copy items from…</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Replace <strong className="text-slate-700">{DAY_FULL[activeDayIndex]}</strong>&apos;s
          items with a copy of another day&apos;s dish selection.
        </p>

        {availableWithItems.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 my-2">
            <span className="text-base block mb-1">⚠️</span>
            No other days have configured dishes yet. Add dishes to at least one other day to copy from it.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {options.map(({ i, date, count, isPublished }) => {
              const hasItems = count > 0 || isPublished;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!hasItems}
                  onClick={() => onCopy(i)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all border ${
                    hasItems
                      ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/80 cursor-pointer shadow-2xs group'
                      : 'border-transparent bg-slate-50 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 transition-colors ${
                      isPublished
                        ? 'bg-emerald-100 text-emerald-800'
                        : hasItems
                        ? 'bg-blue-100 text-blue-800 group-hover:bg-blue-200'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-bold leading-none">
                      {DAY_SHORT[i]}
                    </span>
                    <span className="text-sm font-bold leading-tight">
                      {date ? date.slice(8) : i + 1}
                    </span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold text-slate-800">
                        {DAY_FULL[i]}
                      </span>
                      {isPublished ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          Published ({count} dish{count !== 1 ? 'es' : ''})
                        </span>
                      ) : count > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {count} dish{count !== 1 ? 'es' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          No dishes
                        </span>
                      )}
                    </div>
                    <span className="block text-xs text-slate-400 truncate">
                      {date || `Day ${i + 1}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
