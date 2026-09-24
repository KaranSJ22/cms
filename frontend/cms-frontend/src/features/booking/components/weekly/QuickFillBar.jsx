import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * 1-Click fast booking actions: Book all base items & Reset defaults
 */
export default function QuickFillBar({
  onSelectAllBase,
  onResetDefaults,
  actionMessage,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 self-end">
      <button
        type="button"
        onClick={onSelectAllBase}
        className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
        title="1-Click: Select all base meals across all selectable days"
      >
        <SparklesIcon className="w-3.5 h-3.5" />
        <span>Book Base Items</span>
      </button>

      <button
        type="button"
        onClick={onResetDefaults}
        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
        title="Reset all days to standard pre-checked Base Meals"
      >
        <ArrowPathIcon className="w-3.5 h-3.5" />
        <span>Reset</span>
      </button>

      {actionMessage && (
        <div className="pb-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
          ✓ {actionMessage}
        </div>
      )}
    </div>
  );
}
