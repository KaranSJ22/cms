import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Card 2: Selected Dishes Tray with Steppers and line totals
 */
export default function ComboDishesTray({
  items = [],
  totalPortions = 0,
  onUpdateQty,
  onRemoveItem,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-grotesk">
          2. Included Dishes ({items.length} dishes, {totalPortions} portions)
        </h3>
        {items.length === 0 && (
          <span className="text-[11px] text-amber-500 font-semibold">
            Add at least 1 dish
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-400">
          No dishes added yet. Click &quot;+ Add&quot; on any dish from the catalog on the
          left to include it here.
        </div>
      ) : (
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((it) => {
            const unitPrice = Number(it.PRICE) || 0;
            const lineTotal = unitPrice * (Number(it.QTY) || 1);

            return (
              <div
                key={it.MENUITEMID}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {it.MENUNAME || it.ITEMNAME}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ₹{unitPrice.toFixed(2)} ea × {it.QTY} ={' '}
                    <strong className="text-slate-700 dark:text-slate-300 font-mono">
                      ₹{lineTotal.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQty(
                          it.MENUITEMID,
                          Math.max(1, Number(it.QTY) - 1)
                        )
                      }
                      className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer transition-colors"
                      disabled={Number(it.QTY) <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={it.QTY}
                      onChange={(e) =>
                        onUpdateQty(it.MENUITEMID, e.target.value)
                      }
                      className="w-10 py-0.5 text-xs text-center font-bold bg-transparent text-slate-900 dark:text-white outline-none border-x border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQty(it.MENUITEMID, Number(it.QTY) + 1)
                      }
                      className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(it.MENUITEMID)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Remove from combo"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
