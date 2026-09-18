import { useState, useEffect, useMemo } from "react";
import api from "../../../config/axios";
import { useAuth } from "../../../hooks/useAuth";
import {
  getConfirmedOfficialBookings,
  getOfficialKitchenPrepSummary,
} from "../api/officialApi";
import {
  FireIcon,
  PrinterIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  QueueListIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const getFormattedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatEventDate = (dt) => {
  if (!dt) return "—";
  const d = new Date(typeof dt === "string" ? dt.replace(" ", "T") : dt);
  if (isNaN(d.getTime())) return String(dt);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatEventTime = (dt) => {
  if (!dt) return "—";
  const d = new Date(typeof dt === "string" ? dt.replace(" ", "T") : dt);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function OfficialKitchenPrepPage() {
  const { user, activeCanteenId, setActiveCanteenId } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState(activeCanteenId || "");

  // Date controls
  const [selectedDate, setSelectedDate] = useState(getFormattedDate(0));
  const [activeTab, setActiveTab] = useState("prep"); // 'prep' | 'schedule'
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Canteens accessible to the current user (Manager, Assistant, or Staff)
  useEffect(() => {
    api.get("/canteens").then((res) => {
      const list = res.data.DATA || [];
      const userCanteenIds = (user?.CANTEENROLES || []).map((r) => r.CANTEENID);
      const hasAdminRole = (user?.SYSTEMROLES || []).includes("SYSADM");

      const allowed = hasAdminRole
        ? list
        : list.filter((c) => userCanteenIds.includes(c.CANTEENID));

      setCanteens(allowed);

      if (allowed.length > 0) {
        const isCurrentValid = allowed.some(
          (c) => c.CANTEENID === Number(selectedCanteenId)
        );
        if (!isCurrentValid) {
          const matched = allowed.find(
            (c) => c.CANTEENID === Number(activeCanteenId)
          );
          const targetId = matched ? matched.CANTEENID : allowed[0].CANTEENID;
          setSelectedCanteenId(targetId);
          if (!activeCanteenId) {
            setActiveCanteenId(targetId);
          }
        }
      }
    });
  }, [user]);

  // Keep selectedCanteenId in sync when activeCanteenId changes externally
  useEffect(() => {
    if (
      activeCanteenId &&
      canteens.some((c) => c.CANTEENID === Number(activeCanteenId))
    ) {
      setSelectedCanteenId(Number(activeCanteenId));
    }
  }, [activeCanteenId, canteens]);

  // 2. Load kitchen summary and confirmed bookings for the chosen canteen and date
  const loadData = async () => {
    if (!selectedCanteenId) return;
    try {
      setLoading(true);
      const [summaryRes, ordersRes] = await Promise.all([
        getOfficialKitchenPrepSummary(selectedCanteenId, selectedDate),
        getConfirmedOfficialBookings(selectedCanteenId, { date: selectedDate }),
      ]);
      setSummaryData(summaryRes || null);
      setConfirmedOrders(ordersRes || []);
    } catch (err) {
      console.error("Failed to load official kitchen prep data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCanteenId, selectedDate]);

  // Filtered dishes for Tab 1
  const filteredDishes = useMemo(() => {
    const list = summaryData?.DISHES || [];
    return list.filter((d) => {
      const q = searchQuery.toLowerCase();
      return (
        d.ITEMNAME.toLowerCase().includes(q) ||
        (d.CATNAME && d.CATNAME.toLowerCase().includes(q)) ||
        (d.CATCODE && d.CATCODE.toLowerCase().includes(q))
      );
    });
  }, [summaryData, searchQuery]);

  // Filtered orders for Tab 2
  const filteredOrders = useMemo(() => {
    return confirmedOrders.filter((ord) => {
      const q = searchQuery.toLowerCase();
      const reqName = ord.REQUESTER_NAME || ord.REQ_NAME || "";
      return (
        ord.BOOKNO?.toLowerCase().includes(q) ||
        ord.VENUE?.toLowerCase().includes(q) ||
        ord.PURPOSE?.toLowerCase().includes(q) ||
        reqName.toLowerCase().includes(q) ||
        ord.COMBONAME?.toLowerCase().includes(q)
      );
    });
  }, [confirmedOrders, searchQuery]);

  const totalDishesCount = summaryData?.DISHES?.length || 0;

  const selectedCanteenObj = canteens.find(
    (c) => c.CANTEENID === Number(selectedCanteenId)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Print-only Header Styles ── */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, nav, aside, .no-print {
            display: none !important;
          }
          .print-block {
            display: block !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
          }
        }
      `}</style>

      {/* ── ISRO Space Blue / Saffron Hero Banner ── */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden text-white no-print">
        {/* Abstract space ambient accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-orange-500 text-slate-950 font-grotesk tracking-wider uppercase">
                OPERATIONAL PREPARATION
              </span>
              <span className="text-[0.68rem] text-slate-400 font-mono">
                ISRO-HSFC CMS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Official Kitchen Prep & Schedule
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-blue-100/80 max-w-xl">
              Aggregated dish production quantities & delivery timeline for confirmed official orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Canteen Selector */}
            <select
              value={selectedCanteenId}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedCanteenId(val);
                setActiveCanteenId(val);
              }}
              className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
            >
              {canteens.map((c) => (
                <option
                  key={c.CANTEENID}
                  value={c.CANTEENID}
                  className="bg-slate-900 text-white"
                >
                  {c.CANTEENNAME} ({c.CANTEENCODE})
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Date Filters & View Tabs (Light theme, no-print) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {/* Date Selector & Quick Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Target Date:
          </span>
          <button
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
              if (input && typeof input.showPicker === "function" && e.target !== input) {
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
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "schedule"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            <span>Event Delivery Schedule</span>
            {confirmedOrders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-sky-100 text-sky-700 rounded-md text-[10px]">
                {confirmedOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards (Crisp White Background, Dark Typography) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
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

      {/* ── Print Header Banner (Only visible on paper printout) ── */}
      <div className="hidden print:block mb-4 p-4 border border-black">
        <h2 className="text-xl font-bold uppercase">
          Kitchen Production Sheet — {selectedCanteenObj?.CANTEENNAME || "Canteen"}
        </h2>
        <div className="flex justify-between text-sm mt-2">
          <span>Target Date: <strong>{selectedDate}</strong></span>
          <span>Total Headcount: <strong>{summaryData?.TOTAL_PAX || 0} Pax</strong></span>
          <span>Confirmed Events: <strong>{summaryData?.TOTAL_BOOKINGS || 0}</strong></span>
          <span>Printed: <strong>{new Date().toLocaleString()}</strong></span>
        </div>
      </div>

      {/* ── Loading Spinner ── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-full border-3 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Calculating kitchen quantities for {selectedDate}...
          </p>
        </div>
      ) : summaryData?.TOTAL_BOOKINGS === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <FireIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No Confirmed Official Orders for {selectedDate}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
            There are no official event requests confirmed for preparation on this date.
            Once confirmed by the Canteen Manager in the Official Bookings Monitor, they will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* ────────────────────────────────────────────────────────── */}
          {/* TAB 1: KITCHEN PRODUCTION SHEET                            */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "prep" && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search dish or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing {filteredDishes.length} recipe{filteredDishes.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Dish Production Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse print-table">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Recipe / Dish Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-center">In Bookings</th>
                        <th className="py-3.5 px-4 text-right">Total Prep Quantity</th>
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
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {dish.ITEMNAME}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-600">
                              {dish.CATNAME || dish.CATCODE || "General"}
                            </td>
                            <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                              <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                                {dish.TOTAL_ORDERS_COUNT || dish.ORDER_COUNT || 1} booking{(dish.TOTAL_ORDERS_COUNT || dish.ORDER_COUNT) > 1 ? "s" : ""}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-sm font-black text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
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
                    <InformationCircleIcon className="w-4 h-4 text-orange-500" />
                    <span>
                      Quantities account for combo contents multiplied by the total confirmed headcount.
                    </span>
                  </div>
                  <div>
                    Showing <strong>{filteredDishes.length}</strong> of <strong>{totalDishesCount}</strong> items
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* TAB 2: EVENT DELIVERY SCHEDULE                             */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === "schedule" && (
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

              {/* Cards Timeline (White Cards, Dark Typography) */}
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
                          "{ord.PURPOSE}"
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
          )}
        </>
      )}
    </div>
  );
}
