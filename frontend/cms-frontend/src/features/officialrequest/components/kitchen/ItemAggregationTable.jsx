import {
  MagnifyingGlassIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CubeIcon,
  SparklesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

export default function ItemAggregationTable({
  searchQuery = "",
  setSearchQuery,
  filteredDishes = [],
  totalDishesCount = 0,
  filteredGroupedByBooking = [],
  formatEventTime = (t) => t,
  formatEventDate = (d) => d,
}) {
  return (
    <div className="space-y-8">
      {/* ── Search & Metrics Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="relative flex-1 max-w-lg">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dish, service name, package, booking #, venue, requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
            {filteredGroupedByBooking.length} Event{filteredGroupedByBooking.length !== 1 ? "s" : ""}
          </span>
          <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 font-bold">
            {filteredDishes.length} Recipe{filteredDishes.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── SECTION 1: Service-Wise Event Production Breakdown ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-orange-500" />
              <span>Service-Wise Dish Production</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Items allocated per Official Service & Event Booking for kitchen assembly and fulfillment.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Grouped by Service
          </span>
        </div>

        {filteredGroupedByBooking.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
            No events or items match your search &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredGroupedByBooking.map((booking) => (
              <div
                key={booking.OFFBOOKID}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all hover:shadow-sm"
              >
                {/* ── Booking & Service Header ── */}
                <div className="bg-slate-50/80 border-b border-slate-200 p-4 md:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Primary Badges & Service Info */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white tracking-wide font-mono">
                        {booking.BOOKNO}
                      </span>

                      {/* Official Service Tag */}
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                        <TagIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{booking.SERVNAME}</span>
                      </span>

                      {/* Combo / Package Tag */}
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                        <CubeIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>{booking.COMBONAME}</span>
                      </span>

                      {/* Headcount */}
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-orange-100 text-orange-800 border border-orange-200">
                        {booking.BOOKING_SERVINGS} Pax / Servings
                      </span>
                    </div>

                    {/* Timing & Venue Quick Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 text-orange-600 font-bold">
                        <ClockIcon className="w-4 h-4 text-orange-500" />
                        <span>{formatEventTime(booking.EVENTDATETIME)} IST</span>
                      </div>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPinIcon className="w-4 h-4 text-rose-500" />
                        <span className="font-semibold">{booking.VENUE}</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Details: Requester & Purpose */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Requested by:{" "}
                        <strong className="text-slate-700 font-semibold">
                          {booking.REQUESTER_NAME || "Official User"}
                        </strong>
                        {booking.REQUESTER_EMPCODE && ` (${booking.REQUESTER_EMPCODE})`}
                        {booking.REQUESTER_DEPT && ` • ${booking.REQUESTER_DEPT}`}
                        {booking.REQUESTER_PHONE && ` • Tel: ${booking.REQUESTER_PHONE}`}
                      </span>
                    </div>
                    {booking.PURPOSE && (
                      <p className="italic text-slate-500 line-clamp-1">
                        &ldquo;{booking.PURPOSE}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Items Table for this Booking ── */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse print-table">
                    <thead>
                      <tr className="bg-white border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 sm:px-6">Dish / Recipe Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-center">Per-Pax Ratio</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Preparation Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {booking.items.map((it, idx) => (
                        <tr
                          key={`${it.MENUITEMID}-${idx}`}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3 px-4 sm:px-6 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                              <span>{it.ITEMNAME}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                              {it.CATNAME || it.CATCODE || "General"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-500">
                            {it.COMBO_ITEM_QTY} per person
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-right font-black">
                            <span className="inline-block px-3 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-black">
                              {it.PREP_QTY} portions
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Consolidated Bulk Production Summary (All Events Combined) ── */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-slate-600" />
            <span>Consolidated Bulk Production Summary (All Events Combined)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total portion quantities aggregated across all confirmed official bookings today for bulk kitchen prep.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse print-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Recipe / Dish Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">In Confirmed Events</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Grand Total Prep Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredDishes.map((dish) => {
                  const itemKey = dish.ITEMID || dish.MENUITEMID;
                  return (
                    <tr
                      key={itemKey}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                        {dish.ITEMNAME}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                          {dish.CATNAME || dish.CATCODE || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                          {dish.TOTAL_ORDERS_COUNT || dish.ORDER_COUNT || 1} event
                          {(dish.TOTAL_ORDERS_COUNT || dish.ORDER_COUNT) > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span className="text-sm font-black text-orange-700 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                          {dish.TOTAL_PREP_QTY} portions
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4 text-orange-500 shrink-0" />
              <span>
                Quantities account for combo contents multiplied by the total confirmed headcount across all services.
              </span>
            </div>
            <div>
              Showing <strong>{filteredDishes.length}</strong> of <strong>{totalDishesCount}</strong> recipes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
