import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

/**
 * Combo card with expandable dishes drawer and edit/delete actions
 */
export default function ComboCard({
  combo,
  serviceId,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}) {
  const itemCount = combo.ITEMS?.length || 0;
  const grossPrice = Number(
    combo.GROSSPRICE !== undefined && combo.GROSSPRICE !== null
      ? combo.GROSSPRICE
      : combo.COMBOPRICE
  );
  const handlingFee = Number(combo.HANDLINGCHARGE || 0);

  return (
    <div
      className={`bg-slate-50/90 dark:bg-slate-800/50 rounded-xl p-4 border transition-all flex flex-col ${
        isExpanded
          ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 shadow-md ring-1 ring-orange-500/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
      }`}
    >
      <div>
        <div onClick={onToggleExpand} className="cursor-pointer">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              {combo.COMBONAME}
            </h5>
            <div className="text-right shrink-0">
              <div className="font-black text-orange-600 dark:text-orange-400 text-sm">
                ₹{grossPrice.toFixed(2)}
                <span className="text-[10px] font-semibold text-slate-500 ml-0.5">
                  /pkg
                </span>
              </div>
              {handlingFee > 0 && (
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  +₹{handlingFee.toFixed(2)} on total order
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            {combo.DESCR || 'Standard official catering combo'}
          </p>

          {/* Dish tags preview */}
          <div className="flex flex-wrap gap-1 mb-3">
            {itemCount === 0 ? (
              <span className="text-[11px] text-slate-400 italic">
                No dishes attached
              </span>
            ) : (
              combo.ITEMS.map((dish) => (
                <span
                  key={dish.COMBOITEMID || dish.MENUITEMID}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <span>{dish.MENUNAME || dish.ITEMNAME}</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">
                    ×{dish.QTY}
                  </span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Expanded dishes drawer */}
        {isExpanded && combo.ITEMS && combo.ITEMS.length > 0 && (
          <div className="mt-2.5 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Bundled Dishes ({combo.ITEMS.length})
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {combo.ITEMS.map((dish) => (
                <div
                  key={dish.COMBOITEMID || dish.MENUITEMID}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {dish.MENUNAME || dish.ITEMNAME}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dish.CATCODE} • Qty: {dish.QTY}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    ₹
                    {(
                      Number(dish.OFFPRICE || 0) * Number(dish.QTY || 1)
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown Summary */}
            <div className="p-2.5 rounded-lg bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 text-[11px] space-y-1.5">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="font-medium">Package Food Rate:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  ₹{grossPrice.toFixed(2)}{' '}
                  <span className="text-[10px] font-normal text-slate-500">
                    / package
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="font-medium">Handling Fee:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {handlingFee > 0 ? (
                    <>
                      + ₹{handlingFee.toFixed(2)}{' '}
                      <span className="text-[10px] font-normal text-slate-500">
                        flat on total order
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">₹0.00</span>
                  )}
                </span>
              </div>
              <div className="pt-1.5 border-t border-orange-200/80 dark:border-orange-900/50 flex items-center justify-between text-[10.5px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 -mx-2.5 -mb-2.5 p-2 rounded-b-lg">
                <span>Billing Formula:</span>
                <span className="font-mono font-semibold text-orange-700 dark:text-orange-400">
                  (Qty × ₹{grossPrice.toFixed(2)}){' '}
                  {handlingFee > 0 ? `+ ₹${handlingFee.toFixed(2)}` : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 mt-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 cursor-pointer transition-colors"
        >
          <span>
            {isExpanded ? 'Hide Dishes' : `View Dishes (${itemCount})`}
          </span>
          {isExpanded ? (
            <ChevronUpIcon className="w-3.5 h-3.5" />
          ) : (
            <ChevronDownIcon className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors border border-blue-200/70 dark:border-blue-800 cursor-pointer"
            title="Edit combo details and dishes"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200/70 dark:border-rose-800 cursor-pointer"
            title="Delete this combo"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
