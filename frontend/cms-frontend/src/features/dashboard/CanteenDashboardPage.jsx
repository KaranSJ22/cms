import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getDaySlots } from "../dayslot/api/daySlotsApi";
import { getKitchenPrep } from "../booking/api/bookingApi";
import { getPendingDayMenus } from "../daymenu/api/daymenuApi";
import { fetchWithdrawals } from "../wallet/api/walletApi";
import {
  ArrowPathIcon,
  PrinterIcon,
  ComputerDesktopIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function CanteenDashboardPage() {
  const { activeCanteenId, activeCanteen } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [todaySlots, setTodaySlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotPrepMetrics, setSlotPrepMetrics] = useState([]);
  const [pendingMenusCount, setPendingMenusCount] = useState(0);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canteenName = activeCanteen?.CANTEENNAME || `Canteen Facility #${activeCanteenId || 1}`;

  // Load slots and pending alerts for selected date
  const loadDashboardData = useCallback(async () => {
    if (!activeCanteenId) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch operational day slots for the selected date
      const slotsData = await getDaySlots({
        canteenId: activeCanteenId,
        dateFrom: selectedDate,
        dateTo: selectedDate,
      });

      const slots = Array.isArray(slotsData) ? slotsData : [];
      setTodaySlots(slots);

      // Auto-select first slot if none selected or if previously selected slot is no longer in list
      const initialSlot = slots[0] || null;
      setSelectedSlot(initialSlot);

      if (initialSlot) {
        const prep = await getKitchenPrep(initialSlot.DAYSLOTID);
        setSlotPrepMetrics(Array.isArray(prep) ? prep : []);
      } else {
        setSlotPrepMetrics([]);
      }

      // 2. Fetch pending alerts
      const [pendingMenus, pendingWd] = await Promise.all([
        getPendingDayMenus().catch(() => []),
        fetchWithdrawals({ status: "REQ" }).catch(() => []),
      ]);

      setPendingMenusCount(Array.isArray(pendingMenus) ? pendingMenus.length : 0);
      setPendingWithdrawalsCount(Array.isArray(pendingWd) ? pendingWd.length : 0);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCanteenId, selectedDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle changing active service slot
  const handleSelectSlot = async (slot) => {
    setSelectedSlot(slot);
    setRefreshing(true);
    try {
      const prep = await getKitchenPrep(slot.DAYSLOTID);
      setSlotPrepMetrics(Array.isArray(prep) ? prep : []);
    } catch {
      setSlotPrepMetrics([]);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30s for live kitchen status
  useEffect(() => {
    if (!selectedSlot?.DAYSLOTID) return;
    const interval = setInterval(() => {
      getKitchenPrep(selectedSlot.DAYSLOTID)
        .then((prep) => setSlotPrepMetrics(Array.isArray(prep) ? prep : []))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedSlot?.DAYSLOTID]);

  return (
    <div className="flex-1 bg-slate-100 p-4 md:p-6 space-y-4 font-inter">
      
      {/* ── Space Blue Operations Banner ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-4 md:p-5 shadow-sm text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-orange-500 text-slate-950 font-grotesk tracking-wider uppercase">
                OPERATIONAL DASHBOARD
              </span>
              <span className="text-[0.68rem] text-slate-400 font-mono">
                ISRO-HSFC CMS
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-grotesk mt-1 tracking-tight text-white">
              {canteenName}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Live preparation metrics, meal counter fulfillment status, and pending approvals.
            </p>
          </div>

          {/* Date Picker & Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
            {/* Date Selector */}
            <div className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2 text-xs">
              <CalendarDaysIcon className="w-4 h-4 text-orange-400" />
              <span className="text-[0.65rem] uppercase font-bold text-slate-400">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate("/kiosk/serving-terminal")}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs flex items-center gap-1.5"
            >
              <ComputerDesktopIcon className="w-4 h-4" />
              Serving Terminal
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              Print Sheet
            </button>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadDashboardData();
              }}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Pending Tasks & Alerts (if any) ── */}
      {(pendingMenusCount > 0 || pendingWithdrawalsCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingMenusCount > 0 && (
            <div
              onClick={() => navigate("/daymenu")}
              className="bg-white p-3.5 rounded-md border border-orange-200 shadow-sm hover:border-orange-500 transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-700 font-bold text-sm font-grotesk">
                  {pendingMenusCount}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    Pending Day Menus Awaiting Review
                  </h3>
                  <p className="text-[0.7rem] text-slate-500">
                    {pendingMenusCount} assistant-submitted menu planner(s) pending approval
                  </p>
                </div>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          {pendingWithdrawalsCount > 0 && (
            <div
              onClick={() => navigate("/wallet")}
              className="bg-white p-3.5 rounded-md border border-slate-200 shadow-sm hover:border-blue-900 transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-900 font-bold text-sm font-grotesk">
                  {pendingWithdrawalsCount}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                    Pending Wallet Withdrawals
                  </h3>
                  <p className="text-[0.7rem] text-slate-500">
                    {pendingWithdrawalsCount} contract worker cash withdrawal request(s)
                  </p>
                </div>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>
      )}

      {/* ── Service Slot Selector & Prep Targets ── */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-grotesk uppercase tracking-wide">
              Operational Meal Slots · {selectedDate}
            </h2>
            <p className="text-xs text-slate-500">
              {todaySlots.length > 0
                ? "Select a scheduled meal service to inspect dish preparation volume."
                : "No operating service slots scheduled for this date."}
            </p>
          </div>
          {selectedSlot && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Prep Sync Active
            </div>
          )}
        </div>

        {todaySlots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {todaySlots.map((slot) => {
              const isSelected = selectedSlot?.DAYSLOTID === slot.DAYSLOTID;
              return (
                <button
                  key={slot.DAYSLOTID}
                  onClick={() => handleSelectSlot(slot)}
                  className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <ClockIcon className="w-3.5 h-3.5 opacity-75" />
                  <span>{slot.SERVNAME || `Service #${slot.SERVICEID}`}</span>
                  <span className="text-[0.65rem] opacity-75 font-mono">
                    ({slot.STARTTIME?.slice(0, 5)} - {slot.ENDTIME?.slice(0, 5)})
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 rounded-md border border-dashed border-slate-300 text-center space-y-3">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                No Operating Day-Slots Found for {selectedDate}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Day slots define operating windows for Breakfast, Lunch, and Snacks. Create slots or generate a schedule to view kitchen preparation targets.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={() => navigate("/dayslots")}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                + Create Day Slots
              </button>
              <button
                type="button"
                onClick={() => navigate("/bulk-menu")}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-orange-500 text-slate-950 hover:bg-orange-600 transition-colors shadow-xs"
              >
                Generate from Templates →
              </button>
            </div>
          </div>
        )}

        {/* ── Dish-by-Dish Live Preparation Cards ── */}
        {selectedSlot && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Dish Preparation Requirements ({slotPrepMetrics.length} Items)
              </h3>
            </div>

            {loading || refreshing ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading dish preparation targets...
              </div>
            ) : slotPrepMetrics.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-md border border-dashed border-slate-300 text-center text-slate-500 text-xs">
                No menu items pre-booked for this service slot yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {slotPrepMetrics.map((item) => {
                  const booked = Number(item.TOTAL_BOOKED ?? item.BOOKEDQTY ?? 0);
                  const served = Number(item.TOTAL_SERVED ?? item.SERVEDQTY ?? 0);
                  const remaining = booked > served ? booked - served : 0;
                  const pct = booked > 0 ? Math.min(Math.round((served / booked) * 100), 100) : 0;

                  return (
                    <div
                      key={item.MENUITEMID}
                      className="bg-white rounded-md p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3"
                    >
                      {/* Item Header */}
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[0.62rem] font-bold uppercase tracking-wider text-orange-600">
                            {item.SHORTNAME || (item.ISBASE ? "Base Item" : "Menu Item")}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[0.62rem] font-bold bg-slate-100 text-slate-700">
                            {pct}% served
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                          {item.ITEMNAME || `Dish #${item.MENUITEMID}`}
                        </h4>
                      </div>

                      {/* Cook Target / Must Prepare */}
                      <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 text-center">
                        <span className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 block">
                          Must Prepare (Pre-Booked)
                        </span>
                        <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight my-0.5">
                          {booked}
                        </p>
                        <span className="text-[0.62rem] text-slate-500">units pre-ordered</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-200 rounded h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Served vs Remaining Breakdown */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 text-xs">
                        <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-center">
                          <span className="text-[0.6rem] font-bold uppercase text-emerald-800 block">Served</span>
                          <p className="text-base font-bold text-emerald-900 font-mono">{served}</p>
                        </div>
                        <div className="bg-amber-50 p-2 rounded border border-amber-200 text-center">
                          <span className="text-[0.6rem] font-bold uppercase text-amber-800 block">Pending</span>
                          <p className="text-base font-bold text-amber-900 font-mono">{remaining}</p>
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
    </div>
  );
}
