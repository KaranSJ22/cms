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
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { formatEventDate, formatEventTime } from "../../../utils/date";
import PrepFilterBar from "../components/kitchen/PrepFilterBar";
import ItemAggregationTable from "../components/kitchen/ItemAggregationTable";
import EventTimelineView from "../components/kitchen/EventTimelineView";

const getFormattedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

  // 1. Fetch Canteens accessible to the current user
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

  // 2. Load kitchen summary and confirmed bookings
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

      {/* ── Date Filters & View Tabs ── */}
      <PrepFilterBar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        getFormattedDate={getFormattedDate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalDishesCount={totalDishesCount}
        confirmedOrdersCount={confirmedOrders.length}
        summaryData={summaryData}
        formatEventTime={formatEventTime}
      />

      {/* ── Print Header Banner ── */}
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

      {/* ── Content View ── */}
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
          {activeTab === "prep" && (
            <ItemAggregationTable
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredDishes={filteredDishes}
              totalDishesCount={totalDishesCount}
            />
          )}

          {activeTab === "schedule" && (
            <EventTimelineView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredOrders={filteredOrders}
              formatEventDate={formatEventDate}
              formatEventTime={formatEventTime}
            />
          )}
        </>
      )}
    </div>
  );
}
