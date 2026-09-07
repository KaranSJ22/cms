import { TrashIcon, CheckCircleIcon, PencilSquareIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function CartSummaryPanel({
  cart,
  totalAmount,
  totalItems,
  activeBookings = {},
  onConfirm,
  isSubmitting,
}) {
  const activeBookingEntries = Object.entries(activeBookings);
  const hasActiveBookings = activeBookingEntries.length > 0;
  const hasCartItems = totalItems > 0;

  if (!hasCartItems && !hasActiveBookings) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center h-full flex flex-col justify-center sticky top-6">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No selections</h3>
        <p className="text-slate-500 text-sm">Add items from the menu to start booking or view active bookings.</p>
      </div>
    );
  }

  // Group cart items by SERVICEID
  const groupedCart = Object.values(cart).reduce((acc, item) => {
    if (!acc[item.SERVICEID]) {
      acc[item.SERVICEID] = {
        SERVNAME: item.SERVNAME,
        items: [],
      };
    }
    acc[item.SERVICEID].items.push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[calc(100vh-2rem)] sticky top-4 max-h-[800px]">
      <div className="p-5 border-b border-slate-100 bg-[#0F172A] rounded-t-xl text-white">
        <h2 className="text-lg font-bold flex items-center justify-between">
          <span>Booking Summary</span>
          <div className="flex items-center gap-2">
            {hasCartItems && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {totalItems} new
              </span>
            )}
          </div>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Existing Active Bookings Section */}
        {hasActiveBookings && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Active Bookings
            </div>
            {activeBookingEntries.map(([serviceId, booking]) => {
              const activeItems = (booking.ITEMS || []).filter(
                (item) => item.STATUSCODE === "CRT" || item.STATUSID === 30
              );
              const isReadOnly = booking.isReadOnly;

              return (
                <div
                  key={serviceId}
                  className={`p-4 rounded-xl border mb-3 last:mb-0 ${
                    isReadOnly
                      ? "bg-slate-50 border-slate-200"
                      : "bg-amber-50/60 border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {isReadOnly ? (
                        <LockClosedIcon className="w-4 h-4 text-slate-500" />
                      ) : (
                        <PencilSquareIcon className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="font-bold text-sm text-slate-800">
                        {booking.HEADER?.SERVNAME || `Service #${serviceId}`}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isReadOnly
                          ? "bg-slate-200 text-slate-700"
                          : "bg-amber-200 text-amber-900"
                      }`}
                    >
                      {isReadOnly ? "Locked" : `#${booking.HEADER?.BOOKNO}`}
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-600 mb-2">
                    {activeItems.map((item) => (
                      <li key={item.BOOKITEMID} className="flex justify-between">
                        <span>
                          {item.ITEMNAME} <span className="font-semibold text-slate-800">x{item.QTY}</span>
                        </span>
                        <span className="font-medium text-slate-800">₹{Number(item.AMOUNT).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Booking Total:</span>
                    <span>₹{Number(booking.HEADER?.TOTALAMOUNT || 0).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Unconfirmed Cart Items */}
        {hasCartItems && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              New Booking Cart
            </div>
            {Object.entries(groupedCart).map(([serviceId, group]) => (
              <div key={serviceId} className="mb-4 last:mb-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">
                  {group.SERVNAME}
                </h3>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.DAYMENUID} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{item.ITEMNAME}</p>
                        <p className="text-slate-500 text-xs mt-0.5">₹{item.DISPLAYPRICE} x {item.qty}</p>
                      </div>
                      <div className="font-bold text-slate-900 ml-4 text-sm">
                        ₹{item.qty * item.DISPLAYPRICE}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasCartItems && (
        <div className="p-5 bg-slate-50 rounded-b-xl border-t border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 font-medium text-sm">New Booking Total</span>
            <span className="text-xl font-bold text-[#0F172A]">₹{totalAmount}</span>
          </div>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-[#F4C430] hover:bg-[#e0b42c] text-[#0F172A] font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Confirm New Booking
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-slate-500 mt-2.5">
            Bookings are subject to cutoff times.
          </p>
        </div>
      )}
    </div>
  );
}
