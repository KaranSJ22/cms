import { ClipboardDocumentListIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";

export default function TodayBookingsTab({
  upcomingBookings = [],
  handleCancelBooking,
  cancellingId,
  setActiveTab,
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Your Upcoming Meals
        </h3>
        <span className="text-xs text-slate-500">
          Only pending meals can be cancelled before preparation deadline
        </span>
      </div>

      {upcomingBookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-xl font-bold text-slate-300">
            No active meal reservations found.
          </p>
          <p className="text-sm text-slate-500">
            You do not have any meals pending for today or tomorrow.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("book_next_day")}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-400 text-slate-950 transition-colors cursor-pointer"
          >
            + Book Tomorrow's Meal Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingBookings.map((b) => (
            <div
              key={b.BOOKID}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-orange-400 font-mono">
                    {b.BOOKNO}
                  </span>
                  <h4 className="text-lg font-bold text-white mt-0.5">
                    {b.SERVNAME || `Service #${b.SERVICEID}`}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Date:{" "}
                    <span className="text-slate-200 font-semibold">
                      {b.SERVICEDATE?.slice(0, 10)}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {b.STATUSCODE || "CRT"}
                  </span>
                  <p className="text-sm font-black text-white font-mono mt-1">
                    {formatINR(b.TOTALAMOUNT)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono">
                  Items: {b.TOTALITEMS || b.TOTALQTY || 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleCancelBooking(b.BOOKID)}
                  disabled={cancellingId === b.BOOKID}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <XCircleIcon className="w-4 h-4" />
                  <span>
                    {cancellingId === b.BOOKID
                      ? "Cancelling..."
                      : "Cancel Booking"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
