import { useState } from "react";
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function PendingApprovalsQueue({
  pendingList = [],
  selectedSlotId = null,
  onSelectSlot,
  onApproveSlot,
  onRejectSlot,
  loading = false,
  actionLoadingSlotId = null,
  canteens = [],
  selectedCanteenFilter = "",
  onCanteenFilterChange,
  onRefresh,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Format date helper: "2026-10-30" -> "Fri, 30 Oct 2026"
  const formatSlotDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr.substring(0, 10) + "T00:00:00");
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format time: "08:00:00" -> "08:00"
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  // Service badge color
  const getServiceBadgeStyle = (servName = "") => {
    const s = servName.toUpperCase();
    if (s.includes("BREAKFAST")) return "bg-amber-100 text-amber-900 border-amber-300";
    if (s.includes("LUNCH")) return "bg-orange-100 text-orange-900 border-orange-300";
    if (s.includes("SNACK")) return "bg-sky-100 text-sky-900 border-sky-300";
    if (s.includes("DINNER")) return "bg-indigo-100 text-indigo-900 border-indigo-300";
    return "bg-slate-100 text-slate-800 border-slate-300";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
      {/* ── Queue Header ── */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white border-b border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-700 shrink-0">
            <ClipboardDocumentCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Pending Menu Approvals Queue
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-xs">
                {pendingList.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review day slot menus submitted by assistants. Select any card to inspect and modify items, or approve directly.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {canteens.length > 1 && (
            <select
              value={selectedCanteenFilter}
              onChange={(e) => onCanteenFilterChange?.(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500"
            >
              <option value="">All Canteens</option>
              {canteens.map((c) => (
                <option key={c.CANTEENID} value={c.CANTEENID}>
                  {c.CANTEENNAME}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Pending List"
            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {isCollapsed ? (
              <>
                <span>Show Queue</span>
                <ChevronDownIcon className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Hide</span>
                <ChevronUpIcon className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Queue Body ── */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 bg-slate-50/50">
          {loading && pendingList.length === 0 ? (
            <div className="p-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
              Loading pending approval requests...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">All caught up!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                There are no day slot menus awaiting review. Assistant-submitted menus will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingList.map((slot) => {
                const isSelected = Number(selectedSlotId) === Number(slot.DAYSLOTID);
                const isProcessing = Number(actionLoadingSlotId) === Number(slot.DAYSLOTID);
                const formattedDate = formatSlotDate(slot.SERVICEDATE || slot.SERVDATE);
                const timeRange = `${formatTime(slot.STARTTIME)} - ${formatTime(slot.ENDTIME)}`;
                const itemCount = slot.ITEMCOUNT || 0;
                const dishNames = slot.ITEMSNAMES || "Dishes planned by assistant";

                return (
                  <div
                    key={slot.DAYSLOTID}
                    className={`rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-orange-50/40 border-orange-500 shadow-md ring-2 ring-orange-500/20"
                        : "bg-white border-slate-200 hover:border-orange-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Top Row: Service & Canteen + Selected indicator */}
                    <div className="p-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${getServiceBadgeStyle(
                              slot.SERVNAME
                            )}`}
                          >
                            {slot.SERVNAME || "Service"}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <BuildingStorefrontIcon className="w-3.5 h-3.5 text-slate-400" />
                            {slot.CANTEENNAME}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pt-0.5">
                          <CalendarDaysIcon className="w-4 h-4 text-orange-600 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300 shrink-0 flex items-center gap-1">
                          <SparklesIcon className="w-3 h-3 text-orange-600" />
                          Inspecting
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium text-slate-400 shrink-0">
                          #{slot.SLOTNO || slot.DAYSLOTID}
                        </span>
                      )}
                    </div>

                    {/* Middle Info: Timings & Dish Preview */}
                    <div className="p-4 py-3 space-y-2 flex-1">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                          {timeRange}
                        </span>
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {itemCount} {itemCount === 1 ? "dish" : "dishes"}
                        </span>
                      </div>

                      <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70 text-xs text-slate-700">
                        <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider mb-0.5 text-slate-500">
                          Menu Preview:
                        </div>
                        <p className="line-clamp-2 leading-relaxed text-slate-800">
                          {dishNames}
                        </p>
                      </div>

                      {slot.MENUSUBMITTEDBY && (
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                          <span>By: <strong className="text-slate-700">{slot.MENUSUBMITTEDBY}</strong></span>
                          {slot.MENUSUBMITTEDAT && (
                            <span>{new Date(slot.MENUSUBMITTEDAT).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                          isSelected
                            ? "bg-orange-600 text-white shadow-xs"
                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
                        }`}
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>{isSelected ? "Inspecting Below" : "Review Menu"}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onRejectSlot(slot)}
                          disabled={isProcessing}
                          title="Reject this menu"
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <XCircleIcon className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onApproveSlot(slot)}
                          disabled={isProcessing}
                          title="Approve & Publish immediately"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1"
                        >
                          {isProcessing ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                          )}
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
