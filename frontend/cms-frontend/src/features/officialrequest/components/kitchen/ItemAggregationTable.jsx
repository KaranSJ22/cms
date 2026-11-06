import { useState } from "react";
import {
  MagnifyingGlassIcon,
  InformationCircleIcon,
  ClockIcon,
  TagIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { updateDishPrepStatus } from "../../api/officialApi";

export default function ItemAggregationTable({
  searchQuery = "",
  setSearchQuery,
  filteredDishes = [],
  totalDishesCount = 0,
  formatEventTime = (t) => t,
  selectedCanteenId,
  selectedDate,
  onDishStatusUpdated,
}) {
  // Track expanded dish IDs for viewing which events require each dish
  const [expandedDishIds, setExpandedDishIds] = useState(new Set());
  const [updatingDishId, setUpdatingDishId] = useState(null);

  // Local prep status tracking: { [itemId]: 'pending' | 'cooking' | 'ready' }
  const [prepStatus, setPrepStatus] = useState({});

  // Save prep status updates to backend database
  const handleStatusChange = async (itemId, newStatus) => {
    // 1. Optimistic update
    setPrepStatus((prev) => ({ ...prev, [itemId]: newStatus }));

    // 2. Call backend API if canteen and date are available
    if (selectedCanteenId && selectedDate) {
      try {
        setUpdatingDishId(itemId);
        await updateDishPrepStatus({
          canteenId: selectedCanteenId,
          date: selectedDate,
          menuItemId: itemId,
          status: newStatus.toUpperCase(),
        });
        if (onDishStatusUpdated) {
          onDishStatusUpdated(itemId, newStatus);
        }
      } catch (err) {
        console.error("Failed to update dish cooking status on server", err);
      } finally {
        setUpdatingDishId(null);
      }
    }
  };

  const toggleExpand = (itemId) => {
    setExpandedDishIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Helper to extract earliest time from dish orders
  const getEarliestTime = (dish) => {
    if (!dish.ORDERS || dish.ORDERS.length === 0) return null;
    const timestamps = dish.ORDERS
      .map((o) => (o.EVENTDATETIME ? new Date(o.EVENTDATETIME).getTime() : null))
      .filter((t) => t && !isNaN(t));
    if (timestamps.length === 0) return null;
    return new Date(Math.min(...timestamps));
  };

  // Calculate grand total portions across all filtered dishes
  const grandTotalPortions = filteredDishes.reduce(
    (sum, d) => sum + (Number(d.TOTAL_PREP_QTY) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* ── Search & Metrics Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="relative flex-1 max-w-lg">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dish name, service, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
            {filteredDishes.length} Recipe{filteredDishes.length !== 1 ? "s" : ""}
          </span>
          <span className="px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 font-black shadow-2xs">
            {grandTotalPortions} Total Portions
          </span>
        </div>
      </div>

      {/* ── Consolidated Batch Cooking Sheet ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-orange-500" />
              <span>Consolidated Batch Cooking Sheet</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative preparation quantities for kitchen cooking staff. Tally includes all confirmed official catering today.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Bulk Production Mode
          </span>
        </div>

        {filteredDishes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xs">
            No dishes match your search &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse print-table">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Dish / Recipe Name</th>
                    <th className="py-3.5 px-4">Category / Service</th>
                    <th className="py-3.5 px-4 text-center">Ready-By Deadline</th>
                    <th className="py-3.5 px-4 text-center">In Events</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Grand Total Prep Qty</th>
                    <th className="py-3.5 px-4 text-center no-print">Kitchen Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDishes.map((dish) => {
                    const itemKey = dish.ITEMID || dish.MENUITEMID;
                    const earliest = getEarliestTime(dish);
                    const isExpanded = expandedDishIds.has(itemKey);
                    const orderCount = dish.TOTAL_ORDERS_COUNT || dish.ORDER_COUNT || (dish.ORDERS ? dish.ORDERS.length : 1);
                    const status = prepStatus[itemKey] || dish.PREP_STATUS?.toLowerCase() || "pending";
                    const isSaving = updatingDishId === itemKey;

                    return (
                      <tr
                        key={itemKey}
                        className={`transition-colors ${
                          status === "ready"
                            ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                            : status === "cooking"
                            ? "bg-amber-50/30 hover:bg-amber-50/50"
                            : "hover:bg-slate-50/70"
                        }`}
                      >
                        {/* Recipe / Dish Name */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                status === "ready"
                                  ? "bg-emerald-500"
                                  : status === "cooking"
                                  ? "bg-amber-500 animate-pulse"
                                  : "bg-orange-500"
                              }`}
                            />
                            <div>
                              <span className="font-bold text-slate-900 text-sm">
                                {dish.ITEMNAME}
                              </span>
                              {dish.SHORTNAME && dish.SHORTNAME !== dish.ITEMNAME && (
                                <span className="block text-[11px] text-slate-400 font-mono">
                                  {dish.SHORTNAME}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category / Service */}
                        <td className="py-4 px-4 font-medium text-slate-600">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60">
                            <TagIcon className="w-3 h-3 text-slate-400" />
                            <span>{dish.CATNAME || dish.CATCODE || "General"}</span>
                          </span>
                        </td>

                        {/* Ready-By Deadline */}
                        <td className="py-4 px-4 text-center">
                          {earliest ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200/80 font-bold text-xs">
                              <ClockIcon className="w-3.5 h-3.5 text-orange-500" />
                              <span>{formatEventTime(earliest)} IST</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>

                        {/* In Events (with Expand Toggle) */}
                        <td className="py-4 px-4 text-center">
                          {dish.ORDERS && dish.ORDERS.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(itemKey)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                              title="Click to view/hide order breakdown"
                            >
                              <span>
                                {orderCount} event{orderCount !== 1 ? "s" : ""}
                              </span>
                              {isExpanded ? (
                                <ChevronUpIcon className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronDownIcon className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </button>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                              {orderCount} event{orderCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </td>

                        {/* Grand Total Prep Quantity */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <span className="inline-block px-3.5 py-1.5 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 text-sm font-black shadow-2xs">
                            {dish.TOTAL_PREP_QTY} portions
                          </span>
                        </td>

                        {/* Kitchen Prep Status Toggle */}
                        <td className="py-4 px-4 text-center no-print">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleStatusChange(itemKey, "pending")}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                status === "pending"
                                  ? "bg-white text-slate-800 shadow-2xs"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              Pending
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleStatusChange(itemKey, "cooking")}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                status === "cooking"
                                  ? "bg-amber-500 text-white shadow-2xs"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              Cooking
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleStatusChange(itemKey, "ready")}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                status === "ready"
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              Ready
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Expandable Order Breakdowns (Rendered below table if open) ── */}
            {Array.from(expandedDishIds).map((dishKey) => {
              const dish = filteredDishes.find(
                (d) => (d.ITEMID || d.MENUITEMID) === dishKey
              );
              if (!dish || !dish.ORDERS || dish.ORDERS.length === 0) return null;

              return (
                <div
                  key={`expanded-${dishKey}`}
                  className="bg-slate-50/90 border-t border-slate-200 p-4 sm:p-5 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <InformationCircleIcon className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-slate-800">
                        Event Breakdown for: <strong className="text-orange-700">{dish.ITEMNAME}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(dishKey)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Close Breakdown
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dish.ORDERS.map((ord, idx) => (
                      <div
                        key={`${ord.OFFBOOKID}-${idx}`}
                        className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-mono font-bold text-slate-900 text-[11px]">
                            {ord.BOOKNO}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-black text-[11px]">
                            {ord.PREP_QTY} portions
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-600">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <MapPinIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{ord.VENUE}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-orange-600 font-bold">
                            <ClockIcon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>{formatEventTime(ord.EVENTDATETIME)} IST</span>
                          </div>
                          {ord.REQUESTER_NAME && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {ord.REQUESTER_NAME}
                                {ord.REQUESTER_PHONE ? ` (${ord.REQUESTER_PHONE})` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* ── Table Footer ── */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  All component recipes are pre-calculated for total confirmed headcounts. Tally includes packaging buffers.
                </span>
              </div>
              <div className="font-semibold text-slate-700">
                Showing <strong>{filteredDishes.length}</strong> of <strong>{totalDishesCount}</strong> recipes
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
