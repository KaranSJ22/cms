export default function ActiveBookingCard({
  activeBooking,
  actionLoading,
  handleClear,
  handleServeAll,
  handleServeItem,
  isFutureBookingHeader,
}) {
  if (!activeBooking) return null;

  const isFuture = isFutureBookingHeader(activeBooking);
  const allServed = activeBooking.ITEMS.every((i) => i.STATUSCODE === "SRV");

  return (
    <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
      {/* Customer & Service Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
            {activeBooking.HEADER.BOOKTYPECODE === "PB"
              ? "Pre-Booking"
              : "Kiosk Booking"}
          </span>
          <p className="text-2xl md:text-3xl font-black text-white font-mono">
            {activeBooking.HEADER.BOOKNO}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-slate-400">
              Service:{" "}
              <span className="text-slate-200 font-semibold">
                {activeBooking.HEADER.SERVNAME ||
                  activeBooking.HEADER.SERVICEID}
              </span>
            </p>
            {activeBooking.HEADER.SLOTSTARTTIME && (
              <span className="text-[0.7rem] text-slate-400 font-mono">
                ({activeBooking.HEADER.SLOTSTARTTIME.substring(0, 5)} –{" "}
                {activeBooking.HEADER.SLOTENDTIME?.substring(0, 5)})
              </span>
            )}
            {isFuture && (
              <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Future Booking ({activeBooking.HEADER.SERVICEDATE?.slice(0, 10)})
              </span>
            )}
            {!isFuture && activeBooking.HEADER.ISINWINDOW === 0 && (
              <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Out of Window (Late Arrival)
              </span>
            )}
            {!isFuture && activeBooking.HEADER.ISINWINDOW === 1 && (
              <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Window
              </span>
            )}
          </div>
        </div>
        <div className="sm:text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Customer
          </span>
          <p className="text-xl md:text-2xl font-bold text-white">
            {activeBooking.HEADER.CUSTOMERNAME}
          </p>
          <p className="text-xs text-slate-400 font-mono">
            {activeBooking.HEADER.LOGINID ||
              `ID: ${activeBooking.HEADER.CUSTOMERID}`}
          </p>
        </div>
      </div>

      {/* Itemized Serving List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Booked Items ({activeBooking.ITEMS.length})
          </span>
          <span className="text-xs text-slate-400">
            Click item to serve individually
          </span>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {activeBooking.ITEMS.map((item) => {
            const isServed =
              item.STATUSCODE === "SRV" || item.STATUSID === 32 || item.STATUSID === 31;
            return (
              <div
                key={item.BOOKITEMID}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isServed
                    ? "bg-emerald-950/30 border-emerald-800/50 text-slate-400"
                    : "bg-slate-950 border-slate-800 text-white hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-lg">
                    x{item.QTY}
                  </span>
                  <div>
                    <p
                      className={`text-lg font-bold ${
                        isServed
                          ? "line-through text-slate-500"
                          : "text-white"
                      }`}
                    >
                      {item.ITEMNAME ||
                        item.SHORTNAME ||
                        `Item #${item.MENUITEMID}`}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      ₹
                      {Number(
                        item.AMOUNT || item.RATE * item.QTY
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  {isServed ? (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      ✓ Served
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleServeItem(item.BOOKITEMID)}
                      disabled={actionLoading || isFuture}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 transition-all border border-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      Serve Item
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={actionLoading}
          className="flex-1 py-4 rounded-2xl font-bold text-base bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
        >
          Clear (Esc)
        </button>
        <button
          type="button"
          onClick={handleServeAll}
          disabled={
            actionLoading ||
            isFuture ||
            allServed
          }
          className="flex-[2] py-4 rounded-2xl font-black text-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {actionLoading
            ? "Recording Serve..."
            : isFuture
            ? "FUTURE BOOKING - DISPENSING LOCKED"
            : "SERVE ALL ITEMS"}
        </button>
      </div>
    </div>
  );
}
