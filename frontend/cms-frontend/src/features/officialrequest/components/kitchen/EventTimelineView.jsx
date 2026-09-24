import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

export default function EventTimelineView({
  searchQuery,
  setSearchQuery,
  filteredOrders = [],
  formatEventDate,
  formatEventTime,
}) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-md no-print">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by Booking #, venue, combo, or requester..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs"
        />
      </div>

      {/* Cards Timeline */}
      <div className="space-y-4">
        {filteredOrders.map((ord) => (
          <div
            key={ord.OFFBOOKID}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
          >
            {/* Event Header & Schedule */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-900 border border-slate-200">
                  {ord.BOOKNO}
                </span>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                  <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
                  <span>{formatEventDate(ord.EVENTDATETIME)}</span>
                  <span className="text-slate-300">•</span>
                  <ClockIcon className="w-4 h-4 text-orange-500" />
                  <span>{formatEventTime(ord.EVENTDATETIME)} IST</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700">{ord.SERVNAME}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Confirmed (Prep Active)
                </span>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Venue & Purpose */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <MapPinIcon className="w-4 h-4 text-rose-500" />
                  <span>Delivery Venue:</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">
                  {ord.VENUE}
                </p>
                <p className="text-slate-500 italic">
                  &ldquo;{ord.PURPOSE}&rdquo;
                </p>
              </div>

              {/* Requester & Department */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <UserIcon className="w-4 h-4 text-sky-600" />
                  <span>Requested By:</span>
                </div>
                <p className="font-bold text-slate-900">
                  {ord.REQUESTER_NAME || ord.REQ_NAME || "Employee"}
                  {ord.REQUESTER_EMPCODE && (
                    <span className="ml-1 text-xs text-slate-500 font-mono font-normal">
                      ({ord.REQUESTER_EMPCODE})
                    </span>
                  )}
                </p>
                {(ord.REQUESTER_PHONE || ord.REQ_PHONE) ? (
                  <p className="text-slate-600 flex items-center gap-1">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ord.REQUESTER_PHONE || ord.REQ_PHONE}</span>
                  </p>
                ) : null}
                {(ord.REQUESTER_DEPT || ord.DEPTNAME) && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Dept: {ord.REQUESTER_DEPT || ord.DEPTNAME}
                    {ord.REQUESTER_DESIG && ` • ${ord.REQUESTER_DESIG}`}
                  </p>
                )}
              </div>

              {/* Package & Headcount */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <CubeIcon className="w-4 h-4 text-amber-500" />
                  <span>Booked Package:</span>
                </div>
                <p className="font-bold text-slate-900">
                  {ord.COMBONAME}
                </p>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 font-black text-xs border border-orange-200">
                  {ord.QUANTITY} Pax / Portions
                </div>
              </div>
            </div>

            {/* Packed Items Packing Slip */}
            {ord.ITEMS && ord.ITEMS.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Items to Pack for this Booking ({ord.QUANTITY} portions):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ord.ITEMS.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="font-semibold text-slate-800">
                          {item.ITEMNAME}
                        </span>
                      </div>
                      <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {item.TOTAL_QUANTITY || item.QTY * ord.QUANTITY}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
