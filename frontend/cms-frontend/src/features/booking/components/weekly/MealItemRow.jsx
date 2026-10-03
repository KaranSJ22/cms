import {
  CheckIcon,
  PlusIcon,
  MinusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Single meal item row in the weekly day card (Base meal or Add-on)
 * Specially optimized for ISRO Officers & Senior Staff:
 * - Row 1: Checkbox + Full Dish Title
 * - Row 2: High-contrast Blue Info Button (prominent, easy click target)
 * - Row 3: Dedicated Price Row shifted below Info button (zero horizontal overlap)
 * - Row 4: Portion Stepper (when checked & maxQty > 1)
 */
export default function MealItemRow({
  item,
  qty = 0,
  dateStr,
  onToggleItem,
  onUpdateQty,
  onToggleDescription,
  activeDescriptionId,
}) {
  const isBase = item.ISBASE === 1;
  const isChecked = qty > 0;
  const maxQty = item.MAXQTY || 1;
  const isActiveDescription = activeDescriptionId === item.DAYMENUID;

  if (isBase) {
    return (
      <div
        className={`rounded-xl border p-2.5 transition-all ${isChecked
            ? 'border-orange-400/90 bg-orange-50/50 ring-1 ring-orange-400/20 shadow-xs'
            : 'border-slate-200 bg-slate-50/80 opacity-70 hover:opacity-100'
          }`}
      >
        {/* Clickable Card Body to Toggle Item */}
        <div
          onClick={() => onToggleItem(dateStr, item.DAYMENUID)}
          className="cursor-pointer select-none"
        >
          {/* Row 1: Checkbox + Dish Title (Full width) */}
          <div className="flex items-start gap-2">
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked
                  ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                  : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
            >
              {isChecked && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug break-words block">
                {item.ITEMNAME}
              </span>
            </div>
          </div>

          {/* Row 2: Dedicated Info Button (Senior ISRO Officer-Friendly) */}
          <div className="mt-2">
            <button
              type="button"
              title={`View full details & description for ${item.ITEMNAME}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleDescription?.(item);
              }}
              className={`w-full inline-flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-bold tracking-tight transition-all cursor-pointer border ${isActiveDescription
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-400/40'
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-900'
                }`}
            >
              <InformationCircleIcon className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span>Info</span>
            </button>
          </div>

          {/* Row 3: Dedicated Price Row (Shifted below Info button - zero overlap) */}
          <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-slate-200/70">
            <span className="text-xs sm:text-sm font-mono font-black text-slate-900">
              ₹{item.DISPLAYPRICE}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                Base
              </span>
              {!isChecked && (
                <span className="text-[10px] text-slate-400 font-medium">
                  (Skip)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stepper if checked and MAXQTY > 1 */}
        {isChecked && maxQty > 1 && (
          <div className="mt-2 pt-1.5 border-t border-orange-200/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-600 font-semibold">Portions:</span>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 shadow-2xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQty(dateStr, item.DAYMENUID, -1, maxQty);
                }}
                disabled={qty <= 1}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                title="Decrease portion"
              >
                <MinusIcon className="w-3 h-3 stroke-[2.5]" />
              </button>
              <span className="font-extrabold text-slate-900 text-xs px-1 min-w-[16px] text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQty(dateStr, item.DAYMENUID, 1, maxQty);
                }}
                disabled={qty >= maxQty}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                title="Increase portion"
              >
                <PlusIcon className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Add-on / Extra item
  return (
    <div
      className={`rounded-xl border p-2.5 transition-all ${isChecked
          ? 'border-emerald-400/90 bg-emerald-50/50 ring-1 ring-emerald-400/20 shadow-xs'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
        }`}
    >
      {/* Clickable Card Body to Toggle Item */}
      <div
        onClick={() => onToggleItem(dateStr, item.DAYMENUID)}
        className="cursor-pointer select-none"
      >
        {/* Row 1: Checkbox + Dish Title (Full width) */}
        <div className="flex items-start gap-2">
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
          >
            {isChecked && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words block">
              {item.ITEMNAME}
            </span>
          </div>
        </div>

        {/* Row 2: Dedicated Info Button (Senior ISRO Officer-Friendly) */}
        <div className="mt-2">
          <button
            type="button"
            title={`View full details & description for ${item.ITEMNAME}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleDescription?.(item);
            }}
            className={`w-full inline-flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-bold tracking-tight transition-all cursor-pointer border ${isActiveDescription
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-400/40'
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-900'
              }`}
          >
            <InformationCircleIcon className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span>Info</span>
          </button>
        </div>

        {/* Row 3: Dedicated Price Row (Shifted below Info button - zero overlap) */}
        <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
          <span className="text-xs sm:text-sm font-mono font-black text-emerald-700">
            ₹{item.DISPLAYPRICE}
          </span>
        </div>
      </div>

      {/* Stepper if checked and MAXQTY > 1 */}
      {isChecked && maxQty > 1 && (
        <div className="mt-2 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-600 font-semibold">Portions:</span>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 shadow-2xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(dateStr, item.DAYMENUID, -1, maxQty);
              }}
              disabled={qty <= 1}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              title="Decrease portion"
            >
              <MinusIcon className="w-3 h-3 stroke-[2.5]" />
            </button>
            <span className="font-extrabold text-slate-900 text-xs px-1 min-w-[16px] text-center">
              {qty}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(dateStr, item.DAYMENUID, 1, maxQty);
              }}
              disabled={qty >= maxQty}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              title="Increase portion"
            >
              <PlusIcon className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
