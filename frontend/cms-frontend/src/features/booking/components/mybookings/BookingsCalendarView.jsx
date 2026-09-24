import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { DAYS_OF_WEEK } from "../../hooks/useMyBookings";

export default function BookingsCalendarView({
  monthName,
  prevMonth,
  nextMonth,
  setToday,
  monthlyMetrics,
  calendarDays,
  handleSelectDay,
}) {
  return (
    <div className="space-y-6">
      {/* Calendar Navigation & Monthly Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* Month Navigator Header Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Selected Month
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{monthName}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={setToday}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Monthly Summary Metric: Spend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Monthly Spend
            </span>
            <span className="text-2xl font-black text-[#0F172A] mt-0.5 block">
              ₹{monthlyMetrics.spend.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {monthlyMetrics.totalMeals} meals booked
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <CurrencyRupeeIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Summary Metric: Status Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Service Status
            </span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {monthlyMetrics.servedCount} Served
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {monthlyMetrics.cancelledCount} Cancelled
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 7-Column Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[480px]">
          {calendarDays.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="bg-slate-50/40 p-2 min-h-[95px]"
                />
              );
            }

            const dayBookings = cell.dayBookings || [];
            const hasBookings = dayBookings.length > 0;
            const activeOrServed = dayBookings.filter(
              (b) => (b.HEADER.STATUSCODE || b.HEADER.STATUS) !== "CAN"
            );
            const daySpend = activeOrServed.reduce(
              (sum, b) => sum + (parseFloat(b.HEADER.TOTALAMOUNT) || 0),
              0
            );

            const isToday =
              cell.dateStr === new Date().toISOString().substring(0, 10);

            return (
              <div
                key={cell.dateStr}
                onClick={() => {
                  if (hasBookings) {
                    handleSelectDay(cell.dateStr, dayBookings);
                  }
                }}
                className={`p-2.5 min-h-[95px] flex flex-col justify-between transition-colors ${
                  hasBookings
                    ? "cursor-pointer hover:bg-blue-50/40 bg-white"
                    : "bg-white hover:bg-slate-50/50"
                } ${isToday ? "ring-2 ring-blue-500/20 bg-blue-50/10" : ""}`}
              >
                {/* Day Number and Today Indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : "text-slate-700"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {hasBookings && daySpend > 0 && (
                    <span className="text-[11px] font-black text-slate-900 bg-orange-100/80 text-orange-950 px-1.5 py-0.2 rounded border border-orange-200">
                      ₹{daySpend.toFixed(0)}
                    </span>
                  )}
                </div>

                {/* Booking Chips inside the cell */}
                <div className="mt-1.5 space-y-1">
                  {dayBookings.slice(0, 2).map((b) => {
                    const status = b.HEADER.STATUSCODE || b.HEADER.STATUS;
                    const isCancelled = status === "CAN";
                    return (
                      <div
                        key={b.HEADER.BOOKID}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-semibold flex items-center justify-between ${
                          isCancelled
                            ? "bg-rose-50 text-rose-700 line-through border border-rose-200/60"
                            : status === "SRV"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        <span className="truncate">{b.HEADER.SERVNAME}</span>
                        <span className="font-mono text-[9px] shrink-0 ml-1">
                          ₹{parseFloat(b.HEADER.TOTALAMOUNT).toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                  {dayBookings.length > 2 && (
                    <div className="text-[9px] font-bold text-slate-500 text-center">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
