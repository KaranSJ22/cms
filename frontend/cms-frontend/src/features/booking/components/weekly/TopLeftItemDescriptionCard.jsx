import {
  InformationCircleIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/**
 * TopLeftItemDescriptionCard
 *
 * Displays the full description and details of a selected menu item.
 * Rendered at the top-left of the weekly booking workspace (below header and right of sidebar).
 * Hidden by default until an employee clicks on a menu item's info button.
 */
export default function TopLeftItemDescriptionCard({ item, onClose }) {
  if (!item) return null;

  const isBase = item.ISBASE === 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-600 p-4 transition-all animate-in fade-in slide-in-from-top-2 duration-200 bg-gradient-to-r from-blue-50/30 via-white to-white">
      <div className="flex items-start justify-between gap-3">
        {/* Left icon & details */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2.5 rounded-xl shrink-0 mt-0.5 shadow-2xs ${
              isBase
                ? 'bg-orange-100 text-orange-600 border border-orange-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            {isBase ? (
              <SparklesIcon className="w-5 h-5 stroke-[2]" />
            ) : (
              <InformationCircleIcon className="w-5 h-5 stroke-[2]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 bg-blue-100/70 border border-blue-200/80 px-2 py-0.5 rounded-md">
                Dish Information
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isBase
                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                {isBase ? 'Base Meal' : 'Add-on / Extra'}
              </span>
              {item.SHORTNAME && (
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  [{item.SHORTNAME}]
                </span>
              )}
            </div>

            {/* Dish Title & Price */}
            <div className="flex flex-wrap items-baseline gap-2.5 mb-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {item.ITEMNAME}
              </h3>
              {item.DISPLAYPRICE !== undefined && (
                <span className="text-sm sm:text-base font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  ₹{item.DISPLAYPRICE}
                </span>
              )}
            </div>

            {/* Description Text */}
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed max-w-3xl bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
              {item.ITEMDESCR
                ? item.ITEMDESCR
                : 'No specific preparation notes or description provided for this menu item.'}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0 border border-slate-300"
          title="Close description"
        >
          <XMarkIcon className="w-4 h-4 stroke-[2.5]" />
          <span>Close</span>
        </button>
      </div>
    </div>
  );
}
