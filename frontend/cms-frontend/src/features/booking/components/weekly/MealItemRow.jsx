import { CheckIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

/**
 * Single meal item row in the weekly day card (Base meal or Add-on)
 */
export default function MealItemRow({
  item,
  qty = 0,
  dateStr,
  onToggleItem,
  onUpdateQty,
}) {
  const isBase = item.ISBASE === 1;
  const isChecked = qty > 0;
  const maxQty = item.MAXQTY || 1;

  if (isBase) {
    return (
      <div
        className={`rounded-xl border p-2.5 transition-all ${
          isChecked
            ? 'border-orange-400/80 bg-orange-50/40 ring-1 ring-orange-400/20 shadow-xs'
            : 'border-slate-200 bg-slate-50/60 opacity-60 hover:opacity-90'
        }`}
      >
        <div
          onClick={() => onToggleItem(dateStr, item.DAYMENUID)}
          className="flex items-start gap-2 cursor-pointer select-none"
        >
          {/* Custom Modern Checkbox */}
          <div
            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              isChecked
                ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            {isChecked && <CheckIcon className="w-3 h-3 stroke-[3]" />}
          </div>

          {/* Dish Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-xs font-extrabold text-slate-900 leading-snug break-words">
                {item.ITEMNAME}
              </span>
              <span className="text-xs font-mono font-black text-slate-900 shrink-0">
                ₹{item.DISPLAYPRICE}
              </span>
            </div>

            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-orange-100 text-orange-800">
                Base
              </span>
              {!isChecked && (
                <span className="text-[10px] text-slate-400 font-medium">
                  (Skipped)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stepper if checked and MAXQTY > 1 */}
        {isChecked && maxQty > 1 && (
          <div className="mt-2 pt-1.5 border-t border-orange-200/60 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500 font-medium">Qty:</span>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
              <button
                type="button"
                onClick={() => onUpdateQty(dateStr, item.DAYMENUID, -1, maxQty)}
                disabled={qty <= 1}
                className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              >
                <MinusIcon className="w-3 h-3" />
              </button>
              <span className="font-extrabold text-slate-900 text-xs px-1">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(dateStr, item.DAYMENUID, 1, maxQty)}
                disabled={qty >= maxQty}
                className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              >
                <PlusIcon className="w-3 h-3" />
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
      className={`rounded-xl border p-2 transition-all ${
        isChecked
          ? 'border-emerald-400/80 bg-emerald-50/40 ring-1 ring-emerald-400/20 shadow-xs'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
      }`}
    >
      <div
        onClick={() => onToggleItem(dateStr, item.DAYMENUID)}
        className="flex items-start gap-2 cursor-pointer select-none"
      >
        <div
          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
            isChecked
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          {isChecked && <CheckIcon className="w-3 h-3 stroke-[3]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-slate-800 leading-snug break-words">
              {item.ITEMNAME}
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 shrink-0">
              +₹{item.DISPLAYPRICE}
            </span>
          </div>
        </div>
      </div>

      {isChecked && maxQty > 1 && (
        <div className="mt-1.5 pt-1 border-t border-emerald-200/60 flex items-center justify-between text-xs">
          <span className="text-[9px] text-slate-500 font-medium">Qty:</span>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => onUpdateQty(dateStr, item.DAYMENUID, -1, maxQty)}
              disabled={qty <= 1}
              className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <span className="font-bold text-slate-900 text-xs px-1">{qty}</span>
            <button
              type="button"
              onClick={() => onUpdateQty(dateStr, item.DAYMENUID, 1, maxQty)}
              disabled={qty >= maxQty}
              className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
