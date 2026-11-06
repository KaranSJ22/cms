import { useState } from "react";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CubeIcon,
  PrinterIcon,
  CheckCircleIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { updateOfficialBookingFulfillment } from "../../api/officialApi";

export default function EventTimelineView({
  searchQuery,
  setSearchQuery,
  filteredOrders = [],
  formatEventDate,
  formatEventTime,
  onBookingUpdated,
}) {
  // Track packed items per booking: { [bookingId]: Set(itemIndex) }
  const [packedItems, setPackedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cms_kitchen_packed_items");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track order dispatch status: { [bookingId]: 'packing' | 'ready' | 'dispatched' | 'delivered' }
  const [orderStatus, setOrderStatus] = useState({});
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  const toggleItemPacked = (bookingId, itemIdx) => {
    setPackedItems((prev) => {
      const currentList = prev[bookingId] || [];
      const isPacked = currentList.includes(itemIdx);
      const nextList = isPacked
        ? currentList.filter((i) => i !== itemIdx)
        : [...currentList, itemIdx];

      const next = { ...prev, [bookingId]: nextList };
      try {
        localStorage.setItem("cms_kitchen_packed_items", JSON.stringify(next));
      } catch (e) {
        console.warn("Could not save packed items to localStorage", e);
      }
      return next;
    });
  };

  const setDispatchStatus = async (bookingId, status) => {
    // 1. Optimistic update
    setOrderStatus((prev) => ({ ...prev, [bookingId]: status }));

    // 2. Persist to MySQL database via backend API
    try {
      setUpdatingBookingId(bookingId);
      const apiStatus =
        status === "packing"
          ? "CONFIRMED"
          : status === "ready"
          ? "READY"
          : status === "dispatched"
          ? "DISPATCHED"
          : "DELIVERED";

      await updateOfficialBookingFulfillment(bookingId, apiStatus);
      if (onBookingUpdated) {
        onBookingUpdated(bookingId, apiStatus);
      }
    } catch (err) {
      console.error("Failed to update booking fulfillment on server", err);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Search & Filter Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by Booking #, venue, combo, or requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
            {filteredOrders.length} Confirmed Delivery Slip{filteredOrders.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Order Delivery Cards ── */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xs">
          No confirmed bookings match your search &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((ord) => {
            const bookingId = ord.OFFBOOKID;
            const items = ord.ITEMS || [];
            const packedList = packedItems[bookingId] || [];
            const allItemsPacked = items.length > 0 && packedList.length === items.length;

            const dbStatusMap = {
              37: "packing",
              CNF: "packing",
              61: "ready",
              RDY: "ready",
              62: "dispatched",
              DISP: "dispatched",
              63: "delivered",
              DELV: "delivered",
            };
            const initialStatus =
              dbStatusMap[ord.STATUSCODE] ||
              dbStatusMap[ord.STATUSID] ||
              (allItemsPacked ? "ready" : "packing");
            const status = orderStatus[bookingId] || initialStatus;
            const isUpdating = updatingBookingId === bookingId;

            return (
              <div
                key={bookingId}
                className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition-all hover:shadow-sm print:break-inside-avoid print:mb-6 ${
                  status === "delivered"
                    ? "border-emerald-300 bg-emerald-50/10"
                    : status === "dispatched"
                    ? "border-sky-300 bg-sky-50/10"
                    : status === "ready"
                    ? "border-amber-300 bg-amber-50/10"
                    : "border-slate-200"
                }`}
              >
                {/* ── Header Strip ── */}
                <div className="bg-slate-50/90 border-b border-slate-200 p-4 md:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white tracking-wide font-mono">
                        {ord.BOOKNO}
                      </span>

                      {/* Official Service Tag */}
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                        {ord.SERVNAME || "Official Catering"}
                      </span>

                      {/* Package Name */}
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                        <CubeIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>{ord.COMBONAME}</span>
                      </span>

                      {/* Headcount */}
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-orange-100 text-orange-800 border border-orange-200">
                        {ord.QUANTITY} Pax / Portions
                      </span>
                    </div>

                    {/* Schedule & Timing Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/80">
                        <ClockIcon className="w-4 h-4 text-orange-500" />
                        <span>{formatEventTime(ord.EVENTDATETIME)} IST</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                        <span>{formatEventDate(ord.EVENTDATETIME)}</span>
                      </div>

                      {/* Dispatch Status Selector */}
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 no-print">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setDispatchStatus(bookingId, "packing")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            status === "packing"
                              ? "bg-slate-800 text-white shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Packing
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setDispatchStatus(bookingId, "ready")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            status === "ready"
                              ? "bg-amber-500 text-white shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Ready
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setDispatchStatus(bookingId, "dispatched")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            status === "dispatched"
                              ? "bg-sky-600 text-white shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Dispatched
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setDispatchStatus(bookingId, "delivered")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                            status === "delivered"
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Delivered
                        </button>
                      </div>

                      {/* Print Slip Button */}
                      <button
                        type="button"
                        onClick={() => handlePrintSlip(bookingId)}
                        title="Print Dispatch Slip for this order"
                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer no-print"
                      >
                        <PrinterIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Slip</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Event Details Grid ── */}
                <div className="p-4 md:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Delivery Venue */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                        <MapPinIcon className="w-4 h-4 text-rose-500" />
                        <span>Delivery Location:</span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-sm">
                        {ord.VENUE}
                      </p>
                      {ord.PURPOSE && (
                        <p className="text-slate-500 italic text-[11px] line-clamp-1">
                          &ldquo;{ord.PURPOSE}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Requester Contact */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                        <UserIcon className="w-4 h-4 text-sky-600" />
                        <span>Official Requester:</span>
                      </div>
                      <p className="font-bold text-slate-900">
                        {ord.REQUESTER_NAME || ord.REQ_NAME || "Employee"}
                        {ord.REQUESTER_EMPCODE && (
                          <span className="ml-1 text-[11px] text-slate-500 font-mono font-normal">
                            ({ord.REQUESTER_EMPCODE})
                          </span>
                        )}
                      </p>
                      {(ord.REQUESTER_PHONE || ord.REQ_PHONE) && (
                        <p className="text-slate-600 flex items-center gap-1 font-medium">
                          <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                          <a
                            href={`tel:${ord.REQUESTER_PHONE || ord.REQ_PHONE}`}
                            className="hover:underline text-sky-700"
                          >
                            {ord.REQUESTER_PHONE || ord.REQ_PHONE}
                          </a>
                        </p>
                      )}
                      {(ord.REQUESTER_DEPT || ord.DEPTNAME) && (
                        <p className="text-[11px] text-slate-500">
                          Dept: {ord.REQUESTER_DEPT || ord.DEPTNAME}
                        </p>
                      )}
                    </div>

                    {/* Assembly & Dispatch Summary */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                        <TruckIcon className="w-4 h-4 text-amber-500" />
                        <span>Dispatch Status:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            status === "delivered"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : status === "dispatched"
                              ? "bg-sky-50 text-sky-800 border-sky-300"
                              : status === "ready"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                          <span className="capitalize">{status.replace("_", " ")}</span>
                        </span>

                        {items.length > 0 && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            ({packedList.length}/{items.length} items packed)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Packing Checklist (Trolley / Tray Items) ── */}
                  {items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircleIcon className="w-4 h-4 text-orange-500" />
                          <span>Tray / Trolley Packing Checklist ({ord.QUANTITY} servings):</span>
                        </p>
                        <span className="text-[11px] text-slate-400 no-print">
                          Click items to tick off when placed on tray
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {items.map((item, idx) => {
                          const isPacked = packedList.includes(idx);
                          const quantity = item.TOTAL_PREP_QTY || item.TOTAL_QUANTITY || (item.QTY || 1) * ord.QUANTITY;

                          return (
                            <div
                              key={idx}
                              onClick={() => toggleItemPacked(bookingId, idx)}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                                isPacked
                                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs"
                                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isPacked}
                                  onChange={() => {}} // handled by parent onClick
                                  className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 cursor-pointer"
                                />
                                <span
                                  className={`font-semibold ${
                                    isPacked ? "line-through text-slate-500" : "text-slate-900"
                                  }`}
                                >
                                  {item.ITEMNAME}
                                </span>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-md font-black text-xs border ${
                                  isPacked
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-white text-slate-900 border-slate-200"
                                }`}
                              >
                                {quantity} portions
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
