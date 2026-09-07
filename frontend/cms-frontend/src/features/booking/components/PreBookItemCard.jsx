import { PlusIcon, MinusIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function PreBookItemCard({
  item,
  cartItem,
  onAdd,
  onRemove,
  isEditMode = false,
  isReadOnly = false,
  isLoading = false,
}) {
  const quantity = cartItem?.qty || 0;
  
  // Calculate limits based on AVAILQTY (optional) and MAXQTY (required)
  const isUnlimited = item.AVAILQTY === null || item.AVAILQTY === undefined;
  const availableLimit = isUnlimited ? item.MAXQTY : Math.min(item.AVAILQTY, item.MAXQTY);
  const isSoldOut = !isUnlimited && item.AVAILQTY <= 0;
  
  // Price readiness
  const isPriceAvailable = item.DISPLAYPRICE !== null && item.DISPLAYPRICE !== undefined;
  
  // Overall unavailable status
  const isUnavailable = (isSoldOut && quantity === 0) || !isPriceAvailable;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden flex flex-col h-full ${
        isReadOnly
          ? "border-slate-200 bg-slate-50/50"
          : isUnavailable
          ? "opacity-60 border-slate-200"
          : isEditMode && quantity > 0
          ? "border-amber-300 ring-1 ring-amber-300/50 hover:border-amber-400 hover:shadow-md"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{item.ITEMNAME}</h3>
              {isReadOnly && (
                <LockClosedIcon className="w-4 h-4 text-slate-400" title="Cutoff passed - locked" />
              )}
            </div>
            {item.SHORTNAME && (
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-sm mb-2">
                {item.SHORTNAME}
              </span>
            )}
          </div>
          <div className="text-right">
            {isPriceAvailable ? (
              <span className="block text-xl font-bold text-[#0F172A]">₹{item.DISPLAYPRICE}</span>
            ) : (
              <span className="block text-sm font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded">Unavailable</span>
            )}
          </div>
        </div>
        
        {item.ITEMDESCR && (
          <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
            {item.ITEMDESCR}
          </p>
        )}
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-sm">
            {isReadOnly ? (
              <span className="text-slate-500 font-medium flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Cutoff Passed
              </span>
            ) : isSoldOut ? (
              <span className="text-rose-500 font-semibold">Sold Out</span>
            ) : isUnlimited ? (
              <span className="text-emerald-600 font-medium">Available</span>
            ) : (
              <span className="text-slate-500">
                <span className="font-medium text-slate-700">{item.AVAILQTY}</span> available
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isReadOnly ? (
              quantity > 0 ? (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg border border-slate-200">
                  Qty: {quantity}
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">Not Booked</span>
              )
            ) : !isUnavailable && quantity === 0 ? (
              <button
                onClick={() => onAdd(item)}
                disabled={isLoading}
                className="px-4 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? "..." : isEditMode ? "+ Add Item" : "Add"}
              </button>
            ) : !isUnavailable ? (
              <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                <button
                  onClick={() => onRemove(item)}
                  disabled={isLoading}
                  className="p-1.5 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-l-lg transition-colors disabled:opacity-50"
                  title={quantity === 1 ? (isEditMode ? "Cancel Item" : "Remove from cart") : "Decrease quantity"}
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium text-slate-900 text-sm">
                  {isLoading ? "..." : quantity}
                </span>
                <button
                  onClick={() => onAdd(item)}
                  disabled={isLoading || quantity >= availableLimit}
                  className="p-1.5 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-r-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                  title="Increase quantity"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
