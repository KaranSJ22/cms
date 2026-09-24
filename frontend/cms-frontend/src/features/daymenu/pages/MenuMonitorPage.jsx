import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveCanteens, getDaySlots } from "../../dayslot/api/daySlotsApi";
import { getWeeklyPublishedMenu } from "../../booking/api/bookingApi";
import * as servicesApi from "../../services/api/servicesApi";
import { useAuth } from "../../../hooks/useAuth";
import { getMondayDate, formatDateISO } from "../../../utils/date";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import MenuMonitorFilterBar from "../components/monitor/MenuMonitorFilterBar";
import DayMenuCard from "../components/monitor/DayMenuCard";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MenuMonitorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState("");
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [menuData, setMenuData] = useState(null);
  const [daySlots, setDaySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dates for Monday through Sunday (Full 7-Day Horizon)
  const weekDates = useMemo(() => {
    const monday = getMondayDate(weekOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i);
      const isWeekend = i === 5 || i === 6;
      return {
        dayIndex: i,
        dayName: DAY_NAMES[i],
        dateStr: formatDateISO(dateObj),
        displayDate: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isWeekend,
      };
    });
  }, [weekOffset]);

  const startDateStr = weekDates[0]?.dateStr || "";
  const endDateStr = weekDates[6]?.dateStr || "";

  // 1. Initial Data: Canteens & Services
  useEffect(() => {
    async function loadInitial() {
      try {
        const [canteenData, serviceData] = await Promise.all([
          getActiveCanteens(),
          servicesApi.getServices(),
        ]);

        const userCanteenIds = (user?.CANTEENROLES || []).map((r) => r.CANTEENID);
        const hasAdminRole = (user?.SYSTEMROLES || []).includes("SYSADM");

        let filtered = canteenData || [];
        if (!hasAdminRole && userCanteenIds.length > 0) {
          filtered = filtered.filter((c) => userCanteenIds.includes(c.CANTEENID));
        }

        setCanteens(filtered);
        if (filtered.length > 0 && !selectedCanteen) {
          setSelectedCanteen(filtered[0].CANTEENID);
        }

        const activeSrvs = (serviceData || []).filter((s) => s.STATUSCODE === "ACT");
        setServices(activeSrvs);
        if (activeSrvs.length > 0) {
          setSelectedServiceId(String(activeSrvs[0].SERVICEID));
        }
      } catch (err) {
        console.error("Failed to load initial monitor data", err);
      }
    }
    loadInitial();
  }, [user, selectedCanteen]);

  // Active Service derivation
  const currentServiceIndex = useMemo(() => {
    const idx = services.findIndex((s) => String(s.SERVICEID) === String(selectedServiceId));
    return idx >= 0 ? idx : 0;
  }, [services, selectedServiceId]);

  const activeService = services[currentServiceIndex] || services[0];

  // 2. Fetch Weekly Published Menu & Slots
  const fetchWeeklyMonitor = useCallback(async () => {
    if (!selectedCanteen || !startDateStr || !endDateStr) return;

    setLoading(true);
    setError("");

    try {
      const [weeklyMenu, slots] = await Promise.all([
        getWeeklyPublishedMenu({
          canteenId: selectedCanteen,
          startDate: startDateStr,
          endDate: endDateStr,
        }).catch(() => null),
        getDaySlots({
          CANTEENID: selectedCanteen,
          DATEFROM: startDateStr,
          DATETO: endDateStr,
        }).catch(() => []),
      ]);

      setMenuData(weeklyMenu);
      setDaySlots(slots || []);
    } catch (err) {
      console.error("Failed to fetch menu monitor data", err);
      setError("Unable to load weekly menu monitor. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCanteen, startDateStr, endDateStr]);

  useEffect(() => {
    fetchWeeklyMonitor();
  }, [fetchWeeklyMonitor]);

  // Map slots by date and service: `${dateStr}_${serviceId}`
  const slotsMap = useMemo(() => {
    const map = {};
    daySlots.forEach((slot) => {
      const d = (slot.SERVDATE || "").substring(0, 10);
      if (d && slot.SERVICEID) {
        map[`${d}_${slot.SERVICEID}`] = slot;
      }
    });
    return map;
  }, [daySlots]);

  // Count live slots and dishes for a given service across this week
  const getServiceLiveCount = useCallback(
    (serviceId) => {
      let count = 0;
      weekDates.forEach(({ dateStr }) => {
        const dayInfo = menuData?.daysMap?.[dateStr];
        const srv = dayInfo?.services?.[serviceId];
        if (srv?.items && srv.items.length > 0) count += 1;
      });
      return count;
    },
    [menuData, weekDates]
  );

  const getServiceDishCount = useCallback(
    (serviceId) => {
      let count = 0;
      weekDates.forEach(({ dateStr }) => {
        const dayInfo = menuData?.daysMap?.[dateStr];
        const srv = dayInfo?.services?.[serviceId];
        if (srv?.items) count += srv.items.length;
      });
      return count;
    },
    [menuData, weekDates]
  );

  // Aggregate Metrics for this week
  const metrics = useMemo(() => {
    let totalItemsScheduled = 0;
    let baseItemsCount = 0;
    let publishedSlotsCount = 0;
    let holidaysCount = 0;

    weekDates.forEach(({ dateStr }) => {
      const dayInfo = menuData?.daysMap?.[dateStr];
      if (dayInfo?.isHoliday && !dayInfo?.isSpecialHolidayService) {
        holidaysCount += 1;
      }

      if (dayInfo?.services) {
        Object.values(dayInfo.services).forEach((srv) => {
          if (srv.items && srv.items.length > 0) {
            publishedSlotsCount += 1;
            totalItemsScheduled += srv.items.length;
            baseItemsCount += srv.items.filter((i) => i.ISBASE === 1).length;
          }
        });
      }
    });

    return {
      totalItemsScheduled,
      baseItemsCount,
      publishedSlotsCount,
      holidaysCount,
    };
  }, [menuData, weekDates]);

  // Navigate to single day planner
  const handleOpenPlanner = (dateStr, serviceId) => {
    navigate(`/daymenu?canteen=${selectedCanteen}&date=${dateStr}&service=${serviceId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-12">
      {/* ── ISRO Space Blue Hero Banner ─────────────────────────────────── */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Weekly Menu Monitor
            </h1>
            <p className="mt-1.5 text-blue-100/80 max-w-3xl text-sm">
              Live inspection of scheduled dishes, serving hours, pricing, and availability across all services for the week.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate("/bulk-menu")}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Bulk Menu Creator</span>
            </button>
            <button
              onClick={() => navigate("/daymenu")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Single Day Planner</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── Filter Controls, Service Tabs & KPI Summary Strip ──────────── */}
      <MenuMonitorFilterBar
        canteens={canteens}
        selectedCanteen={selectedCanteen}
        setSelectedCanteen={setSelectedCanteen}
        weekDates={weekDates}
        weekOffset={weekOffset}
        setWeekOffset={setWeekOffset}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        services={services}
        selectedServiceId={selectedServiceId}
        setSelectedServiceId={setSelectedServiceId}
        currentServiceIndex={currentServiceIndex}
        activeService={activeService}
        getServiceLiveCount={getServiceLiveCount}
        getServiceDishCount={getServiceDishCount}
        metrics={metrics}
      />

      {/* ── 7-Day Workspace Grid (Single Card Architecture) ─────────────── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-500 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-3"></div>
          <p className="text-sm font-medium">Loading weekly menu monitor...</p>
        </div>
      ) : !activeService ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <InformationCircleIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No active services configured for this canteen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5 items-start">
          {weekDates.map(({ dateStr, dayName, displayDate, isWeekend }) => (
            <DayMenuCard
              key={dateStr}
              dateStr={dateStr}
              dayName={dayName}
              displayDate={displayDate}
              isWeekend={isWeekend}
              dayInfo={menuData?.daysMap?.[dateStr]}
              activeService={activeService}
              slotInfo={slotsMap[`${dateStr}_${activeService.SERVICEID}`]}
              searchQuery={searchQuery}
              onOpenPlanner={handleOpenPlanner}
            />
          ))}
        </div>
      )}
    </div>
  );
}
