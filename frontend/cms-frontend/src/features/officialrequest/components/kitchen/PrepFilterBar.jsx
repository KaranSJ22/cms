import {
  CalendarDaysIcon,
  QueueListIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function PrepFilterBar({
  selectedDate,
  setSelectedDate,
  getFormattedDate,
  activeTab,
  setActiveTab,
  totalDishesCount,
  confirmedOrdersCount,
  summaryData,
  formatEventTime,
}) {
  return (
    <div className="space-y-6 no-print">
      {/* Date Filters & View Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector & Quick Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Target Date:
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(getFormattedDate(0))}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDate === getFormattedDate(0)
                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(getFormattedDate(1))}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDate === getFormattedDate(1)
                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Tomorrow
          </button>

          {/* High-contrast Date Input Capsule */}
          <div
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input[type="date"]');
              if (
                input &&
                typeof input.showPicker === "function" &&
                e.target !== input
              ) {
                input.showPicker();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-xs cursor-pointer focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-500"
          >
            <CalendarDaysIcon className="w-4 h-4 text-orange-500 shrink-0 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("prep")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "prep"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <QueueListIcon className="w-4 h-4" />
            <span>Dish Production Sheet</span>
            {totalDishesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded-md text-[10px]">
                {totalDishesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "schedule"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            <span>Event Delivery Schedule</span>
            {confirmedOrdersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-sky-100 text-sky-700 rounded-md text-[10px]">
                {confirmedOrdersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Confirmed Bookings
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-slate-900">
              {summaryData?.TOTAL_BOOKINGS || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">orders</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Headcount (Pax)
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-orange-600">
              {summaryData?.TOTAL_PAX || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">people</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Unique Dishes to Cook
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-sky-600">
              {totalDishesCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">recipes</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            First Event Delivery
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-black text-emerald-600">
              {formatEventTime(summaryData?.SUMMARY?.EARLIEST_EVENT)}
            </span>
            <span className="text-xs text-slate-500 font-medium">IST</span>
          </div>
        </div>
      </div>
    </div>
  );
}
