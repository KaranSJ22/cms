import { formatINR } from "../utils/formatters";

export default function TodayBookingsTab({
  upcomingBookings = [],
  declinedBookings = [],
  handleCancelBooking,
  cancellingId,
}) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full">
      {/* Declined / Rejected Pre-Bookings Warning Banner */}
      {declinedBookings.length > 0 && (
        <div className="bg-rose-950/60 border-2 border-rose-600/80 rounded-2xl p-4 shadow-xl space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h4 className="text-sm font-black text-rose-200 uppercase tracking-wide">
              Notice: Booking Declined by Server
            </h4>
          </div>
          {declinedBookings.map((d) => (
            <div
              key={d.bookId}
              className="bg-slate-950/60 border border-rose-800/60 rounded-xl p-3 text-left"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                <span>{d.serviceName} ({d.serviceDate})</span>
                {d.totalAmount != null && (
                  <span className="font-mono text-rose-300">{formatINR(d.totalAmount)}</span>
                )}
              </div>
              <p className="text-xs text-rose-200/90 font-mono">
                Reason: {d.syncError}
              </p>
            </div>
          ))}
          <p className="text-[11px] text-rose-300 font-medium">
            Please top up your wallet at the counter or re-try booking with available items.
          </p>
        </div>
      )}

      {upcomingBookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 max-w-lg mx-auto w-full shadow-lg">
          <span className="text-4xl mb-3 block">🍽️</span>
          <h3 className="text-base font-bold text-white mb-1">No Upcoming Bookings Found</h3>
          <p className="text-xs text-slate-500">
            You have no meal pre-bookings scheduled for today or tomorrow. Tap "Book Tomorrow" to place an order.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {upcomingBookings.map((b) => (
          <div
            key={b.bookId || b.bookNo}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  #{b.bookNo}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    b.isLocalOutbox
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  }`}
                >
                  {b.isLocalOutbox ? "Pending Sync" : "Confirmed"}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{b.serviceName || "Meal Service"}</h4>
              <p className="text-xs text-slate-400 mb-2">
                📅 Scheduled: <span className="font-semibold text-slate-300">{b.serviceDate}</span>
              </p>
              {b.totalAmount != null && (
                <p className="text-xs font-mono text-emerald-400 font-bold mb-3">
                  Total: {formatINR(b.totalAmount)}
                </p>
              )}
            </div>

            {b.isLocalOutbox && (
              <button
                type="button"
                onClick={() => handleCancelBooking(b.bookId)}
                disabled={cancellingId === b.bookId}
                className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                {cancellingId === b.bookId ? "Cancelling..." : "Cancel Pre-Booking"}
              </button>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
