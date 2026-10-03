import { useMemo } from "react";
import {
  ClipboardDocumentListIcon,
  XCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";

export default function TodayBookingsTab({
  upcomingBookings = [],
  handleCancelBooking,
  cancellingId,
  setActiveTab,
  handleStartEditBooking,
  targetDate,
}) {
  // Sort bookings: Active upcoming bookings nearest to current date first, followed by recent past bookings
  const sortedBookings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...upcomingBookings].sort((a, b) => {
      const aDate = a.SERVICEDATE ? String(a.SERVICEDATE).slice(0, 10) : "";
      const bDate = b.SERVICEDATE ? String(b.SERVICEDATE).slice(0, 10) : "";
      const aActive = (a.STATUSCODE === "CRT" || a.STATUSID === 30) && aDate >= today;
      const bActive = (b.STATUSCODE === "CRT" || b.STATUSID === 30) && bDate >= today;

      // Active upcoming bookings come first
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      // If both are active upcoming, nearest date to today comes first (ASC)
      if (aActive && bActive) {
        if (aDate !== bDate) return aDate.localeCompare(bDate);
        return Number(a.BOOKID) - Number(b.BOOKID);
      }

      // If both are past / inactive, most recent date comes first (DESC)
      if (aDate !== bDate) return bDate.localeCompare(aDate);
      return Number(b.BOOKID) - Number(a.BOOKID);
    });
  }, [upcomingBookings]);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Recent Meal Bookings ({upcomingBookings.length})
        </h3>
        <span className="text-[10px] text-slate-500">
          Showing last {upcomingBookings.length} booking{upcomingBookings.length > 1 ? "s" : ""}
        </span>
      </div>

      {upcomingBookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <ClipboardDocumentListIcon className="w-9 h-9 mx-auto text-slate-600" />
          <p className="text-base font-bold text-slate-300">
            No meal reservations found.
          </p>
          <p className="text-xs text-slate-500">
            You do not have any recent meal bookings.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("book_next_day")}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-orange-500 hover:bg-orange-400 text-slate-950 transition-colors cursor-pointer active:scale-95 shadow-md"
          >
            + Book Tomorrow's Meal Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {sortedBookings.map((b) => (
            <div
              key={b.BOOKID}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-orange-400 font-mono">
                    {b.BOOKNO}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {b.SERVNAME || `Service #${b.SERVICEID}`}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Date:{" "}
                    <span className="text-slate-200 font-semibold font-mono">
                      {b.SERVICEDATE?.slice(0, 10)}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      b.STATUSCODE === "CRT" || b.STATUSID === 30
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                        : b.STATUSCODE === "SRV" || b.STATUSID === 32
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : b.STATUSCODE === "CAN" || b.STATUSID === 33
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {b.STATUSCODE === "CRT"
                      ? "Active"
                      : b.STATUSCODE === "SRV"
                      ? "Served"
                      : b.STATUSCODE === "CAN"
                      ? "Cancelled"
                      : b.STATUSCODE || "Active"}
                  </span>
                  <p className="text-xs font-black text-white font-mono mt-1">
                    {formatINR(b.TOTALAMOUNT)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono">
                  Items: {b.TOTALITEMS || b.TOTALQTY || 1}
                </span>
                {(b.STATUSCODE === "CRT" || b.STATUSID === 30) && (
                  <div className="flex items-center gap-1.5">
                    {handleStartEditBooking && (!targetDate || b.SERVICEDATE?.slice(0, 10) === targetDate) && (
                      <button
                        type="button"
                        onClick={() => handleStartEditBooking(b)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(b.BOOKID)}
                      disabled={cancellingId === b.BOOKID}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      <XCircleIcon className="w-3.5 h-3.5" />
                      <span>
                        {cancellingId === b.BOOKID ? "..." : "Cancel"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
