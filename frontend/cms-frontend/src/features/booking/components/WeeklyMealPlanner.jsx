import { useState, useEffect, useMemo, useCallback } from "react";
import { getActiveCanteens } from "../../dayslot/api/daySlotsApi";
import { getWeeklyPublishedMenu, createWeeklyBookingBatch } from "../api/bookingApi";
import { useAuth } from "../../../hooks/useAuth";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
  MinusIcon,
  PlusIcon,
  InformationCircleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

// Helper: Calculate Monday of the week offset (0 = current week, 1 = next week)
function getMonday(offsetWeeks = 0) {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offsetWeeks * 7;
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateISO(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function WeeklyMealPlanner() {
  const { customer, user } = useAuth();

  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState("");

  // Default to Next Week if today is Thursday, Friday, or weekend
  const defaultWeekOffset = useMemo(() => {
    const day = new Date().getDay();
    return day >= 4 || day === 0 ? 1 : 0;
  }, []);

  const [weekOffset, setWeekOffset] = useState(defaultWeekOffset);
  const [serviceFilter, setServiceFilter] = useState("BOTH"); // "BREAKFAST" | "LUNCH" | "BOTH"

  // Dates for Monday through Friday
  const weekDates = useMemo(() => {
    const monday = getMonday(weekOffset);
    return Array.from({ length: 5 }, (_, i) => {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i);
      return {
        dayIndex: i,
        dayName: DAY_NAMES[i],
        dateStr: formatDateISO(dateObj),
        displayDate: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    });
  }, [weekOffset]);

  const startDateStr = weekDates[0]?.dateStr || "";
  const endDateStr = weekDates[4]?.dateStr || "";

  // Menu data from backend
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Item Quantities Map: { [dateStr]: { selected: boolean, quantities: { [dayMenuId]: number } } }
  const [daySelections, setDaySelections] = useState({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState("");

  // Customer type detection
  const customerType = customer?.CTYPECODE || user?.CTYPECODE || "PRM";
  const isPayrollDeducted = ["PRM", "PERMEMP", "OCE", "OCEEMP"].includes(customerType);

  // 1. Load active canteens on mount
  useEffect(() => {
    async function loadCanteens() {
      try {
        const data = await getActiveCanteens();
        setCanteens(data || []);
        if (data && data.length > 0 && !selectedCanteen) {
          setSelectedCanteen(data[0].CANTEENID);
        }
      } catch (err) {
        console.error("Failed to load canteens", err);
      }
    }
    loadCanteens();
  }, [selectedCanteen]);

  // 2. Fetch published menu for selected week and canteen
  const fetchMenu = useCallback(async () => {
    if (!selectedCanteen || !startDateStr || !endDateStr) return;

    setLoading(true);
    setFetchError("");
    setSubmitSuccess(null);
    setSubmitError("");

    try {
      const data = await getWeeklyPublishedMenu({
        canteenId: selectedCanteen,
        startDate: startDateStr,
        endDate: endDateStr,
      });
      setMenuData(data);
    } catch (err) {
      console.error("Failed to fetch weekly menu", err);
      setFetchError(err?.response?.data?.MESSAGE || "Could not load weekly menu. Please try another week or canteen.");
    } finally {
      setLoading(false);
    }
  }, [selectedCanteen, startDateStr, endDateStr]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // 3. Initialize / Reset smart defaults: Base meals are pre-checked (qty = 1), add-ons are unchecked (qty = 0)
  const resetToSmartDefaults = useCallback(() => {
    if (!menuData || !menuData.daysMap) return;

    const now = new Date();
    const newSelections = {};

    weekDates.forEach(({ dateStr }) => {
      const dayInfo = menuData.daysMap[dateStr];
      const isHoliday = dayInfo?.isHoliday || false;

      const quantities = {};
      let hasAnyAvailableDish = false;

      if (dayInfo && dayInfo.services) {
        Object.values(dayInfo.services).forEach((srv) => {
          const srvCodeUpper = (srv.servCode || "").toUpperCase();
          const isBreakfast = srvCodeUpper.includes("BR") || srv.servName.toLowerCase().includes("breakfast");
          const isLunch = srvCodeUpper.includes("LU") || srv.servName.toLowerCase().includes("lunch");

          let shouldInclude = false;
          if (serviceFilter === "BOTH") shouldInclude = isBreakfast || isLunch || true;
          else if (serviceFilter === "BREAKFAST") shouldInclude = isBreakfast;
          else if (serviceFilter === "LUNCH") shouldInclude = isLunch;

          const isAlreadyBooked = Boolean(srv.existingBooking);

          (srv.items || []).forEach((item) => {
            const isCutoffPassed = item.BOOKUNTIL ? now > new Date(item.BOOKUNTIL) : false;

            if (shouldInclude && !isHoliday && !isAlreadyBooked && !isCutoffPassed) {
              // Base Item defaults to CHECKED (qty = 1)
              if (item.ISBASE === 1) {
                quantities[item.DAYMENUID] = 1;
                hasAnyAvailableDish = true;
              } else {
                // Addons default to UNCHECKED (qty = 0)
                quantities[item.DAYMENUID] = 0;
              }
            } else {
              quantities[item.DAYMENUID] = 0;
            }
          });
        });
      }

      newSelections[dateStr] = {
        selected: !isHoliday && hasAnyAvailableDish,
        quantities,
      };
    });

    setDaySelections(newSelections);
  }, [menuData, weekDates, serviceFilter]);

  useEffect(() => {
    resetToSmartDefaults();
  }, [resetToSmartDefaults]);

  // ---------------------------------------------------------------------------
  // INTERACTION HANDLERS
  // ---------------------------------------------------------------------------

  // Toggle entire day on / off
  const toggleDaySelection = (dateStr) => {
    setDaySelections((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        selected: !prev[dateStr]?.selected,
      },
    }));
  };

  // Toggle dish checked / unchecked (Base item or Add-on)
  const toggleItem = (dateStr, dayMenuId) => {
    setDaySelections((prev) => {
      const day = prev[dateStr] || { selected: true, quantities: {} };
      const currentQty = day.quantities?.[dayMenuId] || 0;
      const nextQty = currentQty > 0 ? 0 : 1;

      return {
        ...prev,
        [dateStr]: {
          ...day,
          quantities: {
            ...day.quantities,
            [dayMenuId]: nextQty,
          },
        },
      };
    });
  };

  // Stepper quantity update for an active dish
  const updateItemQty = (dateStr, dayMenuId, delta, maxQty = 1) => {
    setDaySelections((prev) => {
      const day = prev[dateStr];
      if (!day) return prev;
      const currentQty = day.quantities?.[dayMenuId] || 0;
      const newQty = Math.max(1, Math.min(maxQty, currentQty + delta));

      return {
        ...prev,
        [dateStr]: {
          ...day,
          quantities: {
            ...day.quantities,
            [dayMenuId]: newQty,
          },
        },
      };
    });
  };

  // ---------------------------------------------------------------------------
  // REAL-TIME CART & SUMMARY CALCULATOR
  // ---------------------------------------------------------------------------
  const summary = useMemo(() => {
    if (!menuData || !menuData.daysMap) {
      return { totalDays: 0, totalMeals: 0, totalAmount: 0, breakdown: [] };
    }

    let totalDays = 0;
    let totalMeals = 0;
    let totalAmount = 0;
    const breakdown = [];

    weekDates.forEach(({ dateStr, dayName, displayDate }) => {
      const daySelection = daySelections[dateStr];
      if (!daySelection || !daySelection.selected) return;

      const dayInfo = menuData.daysMap[dateStr];
      if (!dayInfo || dayInfo.isHoliday) return;

      let dayTotal = 0;
      let dayItemsCount = 0;
      const dayLines = [];

      Object.values(dayInfo.services || {}).forEach((srv) => {
        if (srv.existingBooking) return;

        (srv.items || []).forEach((item) => {
          const qty = daySelection.quantities?.[item.DAYMENUID] || 0;
          if (qty > 0) {
            const price = Number(item.DISPLAYPRICE) || 0;
            const lineTotal = price * qty;
            dayTotal += lineTotal;
            dayItemsCount += qty;
            dayLines.push({
              name: `${item.ITEMNAME}${qty > 1 ? ` (x${qty})` : ""}`,
              serviceName: srv.servName,
              price: lineTotal,
            });
          }
        });
      });

      if (dayLines.length > 0) {
        totalDays += 1;
        totalMeals += dayItemsCount;
        totalAmount += dayTotal;
        breakdown.push({
          dateStr,
          dayName,
          displayDate,
          dayTotal,
          lines: dayLines,
        });
      }
    });

    return { totalDays, totalMeals, totalAmount, breakdown };
  }, [menuData, weekDates, daySelections]);

  // ---------------------------------------------------------------------------
  // SUBMISSION HANDLER (ATOMIC 5-DAY BATCH)
  // ---------------------------------------------------------------------------
  const handleConfirmWeeklyBooking = async () => {
    if (summary.totalDays === 0 || summary.totalMeals === 0) {
      setSubmitError("Please select at least one meal to book.");
      return;
    }

    if (!customer?.CUSTOMERID) {
      setSubmitError("Customer account not found. Please re-login.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(null);

    // Build the atomic payload for CMSADDBOOKWEEKLY
    const bookingsPayload = [];

    weekDates.forEach(({ dateStr }) => {
      const daySelect = daySelections[dateStr];
      if (!daySelect || !daySelect.selected) return;

      const dayInfo = menuData?.daysMap?.[dateStr];
      if (!dayInfo || dayInfo.isHoliday) return;

      Object.values(dayInfo.services || {}).forEach((srv) => {
        if (srv.existingBooking) return;

        const itemsForService = [];
        (srv.items || []).forEach((item) => {
          const qty = daySelect.quantities?.[item.DAYMENUID] || 0;
          if (qty > 0) {
            itemsForService.push({
              DAYMENUID: item.DAYMENUID,
              QTY: qty,
            });
          }
        });

        if (itemsForService.length > 0) {
          bookingsPayload.push({
            SERVICEDATE: dateStr,
            SERVICEID: srv.serviceId,
            ITEMS: itemsForService,
          });
        }
      });
    });

    try {
      const res = await createWeeklyBookingBatch({
        PBOOKTYPECODE: "PB",
        PCUSTOMERID: customer.CUSTOMERID,
        PBOOKINGSJSON: bookingsPayload,
        PREMARKS: `5-Day Weekly Pass (${startDateStr} to ${endDateStr})`,
      });

      setSubmitSuccess({
        message: `Successfully booked ${bookingsPayload.length} daily meal sessions!`,
        bookings: res || [],
        totalAmount: summary.totalAmount,
      });

      // Refetch week data so newly booked days show as "Already Booked"
      await fetchMenu();
    } catch (err) {
      console.error("Weekly booking error:", err);
      setSubmitError(err?.response?.data?.MESSAGE || "Failed to place weekly booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP CONTROL TOOLBAR ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Canteen & Week Selector */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Canteen Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Canteen
              </label>
              <select
                value={selectedCanteen}
                onChange={(e) => setSelectedCanteen(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
              >
                {canteens.map((c) => (
                  <option key={c.CANTEENID} value={c.CANTEENID}>
                    {c.CANTEENNAME}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Navigator */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Target Week
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                  disabled={weekOffset === 0}
                  className="p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                  title="Previous Week"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>

                <div className="px-3.5 text-xs font-bold text-slate-800 flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
                  <span>
                    {weekDates[0]?.displayDate} – {weekDates[4]?.displayDate}, 2026
                  </span>
                  {weekOffset === 0 ? (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded-md font-medium">
                      This Week
                    </span>
                  ) : weekOffset === 1 ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-md font-bold flex items-center gap-1">
                      <SparklesIcon className="w-3 h-3" /> Next Week
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => Math.min(3, prev + 1))}
                  disabled={weekOffset >= 3}
                  className="p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                  title="Next Week"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Service Filter & Smart Actions */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Service Toggle */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Meal Service
              </label>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setServiceFilter("BREAKFAST")}
                  className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                    serviceFilter === "BREAKFAST" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🍳 Breakfast
                </button>
                <button
                  type="button"
                  onClick={() => setServiceFilter("LUNCH")}
                  className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                    serviceFilter === "LUNCH" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🍛 Lunch
                </button>
                <button
                  type="button"
                  onClick={() => setServiceFilter("BOTH")}
                  className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                    serviceFilter === "BOTH" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🍱 Both
                </button>
              </div>
            </div>

            {/* Reset to Default Base Items */}
            <div className="self-end">
              <button
                type="button"
                onClick={resetToSmartDefaults}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Reset all days to standard pre-checked Base Meals"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                <span>Reset to Base</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
          <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-emerald-900">{submitSuccess.message}</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Total billable amount: <span className="font-bold">₹{submitSuccess.totalAmount}</span>.
              {isPayrollDeducted
                ? " This will be itemized in your monthly payroll salary slip."
                : " This amount has been deducted from your active wallet balance."}
            </p>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {submitError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
          <XCircleIcon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-900">Booking Unsuccessful</h3>
            <p className="text-xs text-rose-700 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* ── 70/30 MAIN DESKTOP GRID ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDE: 5-DAY INTERACTIVE WORKSPACE (xl:col-span-9) */}
        <div className="xl:col-span-9">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-3"></div>
              <p className="text-sm font-medium">Loading weekly menus & schedules...</p>
            </div>
          ) : fetchError ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <InformationCircleIcon className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Weekly Schedule Unavailable</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">{fetchError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {weekDates.map(({ dateStr, dayName, displayDate }) => {
                const dayInfo = menuData?.daysMap?.[dateStr];
                const isHoliday = dayInfo?.isHoliday || false;
                const holidayName = dayInfo?.holidayName;
                const daySelect = daySelections[dateStr];
                const isDaySelected = daySelect?.selected && !isHoliday;

                // Services available for this day
                const servicesList = dayInfo?.services ? Object.values(dayInfo.services) : [];

                return (
                  <div
                    key={dateStr}
                    className={`rounded-2xl border transition-all flex flex-col h-full overflow-hidden ${
                      isHoliday
                        ? "bg-slate-50/70 border-slate-200 opacity-60"
                        : isDaySelected
                        ? "bg-white border-slate-300 shadow-sm ring-1 ring-slate-900/5"
                        : "bg-slate-100/70 border-slate-200 opacity-70"
                    }`}
                  >
                    {/* Day Column Header */}
                    <div
                      className={`p-3.5 border-b flex items-center justify-between transition-colors ${
                        isHoliday
                          ? "bg-slate-100 border-slate-200 text-slate-500"
                          : isDaySelected
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-200/80 text-slate-600 border-slate-200"
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider block leading-tight">
                          {dayName}
                        </span>
                        <span className="text-xs font-semibold opacity-90">{displayDate}</span>
                      </div>

                      {/* Day Active Toggle Badge Button */}
                      {!isHoliday ? (
                        <button
                          type="button"
                          onClick={() => toggleDaySelection(dateStr)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isDaySelected
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : "bg-slate-300 text-slate-700 hover:bg-slate-400/80"
                          }`}
                          title={isDaySelected ? "Click to skip this whole day" : "Click to include this day"}
                        >
                          {isDaySelected ? (
                            <>
                              <CheckIcon className="w-3 h-3 stroke-[3]" />
                              <span>Included</span>
                            </>
                          ) : (
                            <span>Skipped</span>
                          )}
                        </button>
                      ) : null}
                    </div>

                    {/* Day Column Body */}
                    <div className="p-3.5 flex-1 flex flex-col space-y-4">
                      {isHoliday ? (
                        <div className="py-10 text-center flex-1 flex flex-col items-center justify-center">
                          <span className="text-3xl mb-2">🏖️</span>
                          <span className="text-xs font-bold text-slate-700">Public Holiday</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">{holidayName || "Canteen Closed"}</span>
                        </div>
                      ) : servicesList.length === 0 ? (
                        <div className="py-10 text-center flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                          <span>No published menu</span>
                        </div>
                      ) : !isDaySelected ? (
                        <div className="py-10 text-center flex-1 flex flex-col items-center justify-center text-slate-500">
                          <span className="text-sm font-bold text-slate-600">Day Skipped</span>
                          <span className="text-[11px] text-slate-400 mt-1">Click top toggle to include</span>
                        </div>
                      ) : (
                        // Active Day: Render services (Breakfast & Lunch)
                        servicesList.map((srv) => {
                          const srvCodeUpper = (srv.servCode || "").toUpperCase();
                          const isBreakfast = srvCodeUpper.includes("BR") || srv.servName.toLowerCase().includes("breakfast");
                          const isLunch = srvCodeUpper.includes("LU") || srv.servName.toLowerCase().includes("lunch");

                          // Filter visibility by top toolbar
                          if (serviceFilter === "BREAKFAST" && !isBreakfast) return null;
                          if (serviceFilter === "LUNCH" && !isLunch) return null;

                          const existingBooking = srv.existingBooking;
                          const allItems = srv.items || [];
                          const baseItems = allItems.filter((i) => i.ISBASE === 1);
                          const extraItems = allItems.filter((i) => i.ISBASE !== 1);

                          return (
                            <div key={srv.serviceId} className="space-y-2">
                              {/* Service Name Header */}
                              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                  <span>{isBreakfast ? "🍳" : "🍛"}</span>
                                  <span>{srv.servName}</span>
                                </span>

                                {existingBooking && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                    <CheckIcon className="w-3 h-3 stroke-[3]" /> Booked
                                  </span>
                                )}
                              </div>

                              {existingBooking ? (
                                <p className="text-[11px] text-slate-500 italic py-2">
                                  Booking #{existingBooking.BOOKNO} already confirmed.
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {/* ── 1. BASE MEALS (PRE-CHECKED BY DEFAULT) ── */}
                                  {baseItems.map((item) => {
                                    const qty = daySelect?.quantities?.[item.DAYMENUID] || 0;
                                    const isChecked = qty > 0;
                                    const maxQty = item.MAXQTY || 1;

                                    return (
                                      <div
                                        key={item.DAYMENUID}
                                        className={`rounded-xl border p-3 transition-all ${
                                          isChecked
                                            ? "border-orange-400/80 bg-orange-50/40 ring-1 ring-orange-400/20 shadow-xs"
                                            : "border-slate-200 bg-slate-50/60 opacity-60 hover:opacity-90"
                                        }`}
                                      >
                                        <div
                                          onClick={() => toggleItem(dateStr, item.DAYMENUID)}
                                          className="flex items-start gap-2.5 cursor-pointer select-none"
                                        >
                                          {/* Custom Modern Checkbox (20px) */}
                                          <div
                                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                              isChecked
                                                ? "bg-orange-500 border-orange-500 text-white shadow-xs"
                                                : "border-slate-300 bg-white hover:border-slate-400"
                                            }`}
                                          >
                                            {isChecked && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                                          </div>

                                          {/* Dish Details */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                              <span className="text-xs font-extrabold text-slate-900 leading-snug break-words">
                                                {item.ITEMNAME}
                                              </span>
                                              <span className="text-xs font-black text-slate-900 shrink-0">
                                                ₹{item.DISPLAYPRICE}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 mt-1">
                                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                                                Base Meal
                                              </span>
                                              {!isChecked && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                  (Unchecked)
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Stepper if checked and MAXQTY > 1 */}
                                        {isChecked && maxQty > 1 && (
                                          <div className="mt-2.5 pt-2 border-t border-orange-200/60 flex items-center justify-between text-xs">
                                            <span className="text-[10px] text-slate-500 font-medium">
                                              Qty (Max {maxQty}):
                                            </span>
                                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                                              <button
                                                type="button"
                                                onClick={() => updateItemQty(dateStr, item.DAYMENUID, -1, maxQty)}
                                                disabled={qty <= 1}
                                                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                              >
                                                <MinusIcon className="w-3 h-3" />
                                              </button>
                                              <span className="font-extrabold text-slate-900 text-xs px-1">
                                                {qty}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => updateItemQty(dateStr, item.DAYMENUID, 1, maxQty)}
                                                disabled={qty >= maxQty}
                                                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                              >
                                                <PlusIcon className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* ── 2. EXTRAS & ADD-ONS ── */}
                                  {extraItems.length > 0 && (
                                    <div className="pt-1.5">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                                        Extras & Add-ons
                                      </span>

                                      <div className="space-y-1.5">
                                        {extraItems.map((item) => {
                                          const qty = daySelect?.quantities?.[item.DAYMENUID] || 0;
                                          const isChecked = qty > 0;
                                          const maxQty = item.MAXQTY || 1;

                                          return (
                                            <div
                                              key={item.DAYMENUID}
                                              className={`rounded-xl border p-2.5 transition-all ${
                                                isChecked
                                                  ? "border-emerald-400/80 bg-emerald-50/40 ring-1 ring-emerald-400/20 shadow-xs"
                                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                                              }`}
                                            >
                                              <div
                                                onClick={() => toggleItem(dateStr, item.DAYMENUID)}
                                                className="flex items-start gap-2.5 cursor-pointer select-none"
                                              >
                                                {/* Custom Checkbox (20px) */}
                                                <div
                                                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                                    isChecked
                                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                                      : "border-slate-300 bg-white hover:border-slate-400"
                                                  }`}
                                                >
                                                  {isChecked && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>

                                                {/* Item Name & Price */}
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center justify-between gap-1">
                                                    <span className="text-xs font-bold text-slate-800 leading-snug break-words">
                                                      {item.ITEMNAME}
                                                    </span>
                                                    <span className="text-xs font-black text-slate-700 shrink-0">
                                                      +₹{item.DISPLAYPRICE}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Stepper if checked and MAXQTY > 1 */}
                                              {isChecked && maxQty > 1 && (
                                                <div className="mt-2 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                                                  <span className="text-[10px] text-slate-500 font-medium">
                                                    Qty:
                                                  </span>
                                                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                                                    <button
                                                      type="button"
                                                      onClick={() => updateItemQty(dateStr, item.DAYMENUID, -1, maxQty)}
                                                      disabled={qty <= 1}
                                                      className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    >
                                                      <MinusIcon className="w-3 h-3" />
                                                    </button>
                                                    <span className="font-bold text-slate-900 text-xs px-1">
                                                      {qty}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={() => updateItemQty(dateStr, item.DAYMENUID, 1, maxQty)}
                                                      disabled={qty >= maxQty}
                                                      className="p-0.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                                    >
                                                      <PlusIcon className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: 30% STICKY SUMMARY & CHECKOUT RAIL (xl:col-span-3) */}
        <div className="xl:col-span-3 sticky top-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
              <CalendarDaysIcon className="w-5 h-5 text-orange-500" />
              <span>Weekly Pass Summary</span>
            </h2>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Days Booked</span>
                <span className="text-xl font-extrabold text-slate-800">
                  {summary.totalDays} of 5
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                <span className="block text-[11px] font-bold text-slate-400 uppercase">Total Items</span>
                <span className="text-xl font-extrabold text-slate-800">
                  {summary.totalMeals}
                </span>
              </div>
            </div>

            {/* Itemized Daily Breakdown */}
            <div className="mb-4 max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
              {summary.breakdown.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic">
                  No meals selected yet.
                </div>
              ) : (
                summary.breakdown.map((b) => (
                  <div key={b.dateStr} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center font-bold text-slate-800 mb-1">
                      <span>{b.dayName} ({b.displayDate})</span>
                      <span className="font-extrabold">₹{b.dayTotal}</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-500">
                      {b.lines.map((l, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span className="truncate pr-1">• {l.name}</span>
                          <span className="shrink-0 font-semibold text-slate-700">₹{l.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>

            {/* Total Deduction Box */}
            <div className="pt-3 border-t border-slate-200 mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-bold text-slate-700">Total Week Bill:</span>
                <span className="text-2xl font-black text-[#0F172A]">
                  ₹{summary.totalAmount}
                </span>
              </div>

              {/* Customer Type / Billing Context Badge (For Contract Employees) */}
              {!isPayrollDeducted && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <span className="text-sm">💳</span>
                    <div>
                      <span className="font-bold text-slate-900 block">CMS Wallet Deduction</span>
                      <span>₹{summary.totalAmount} will be deducted from your wallet upon confirmation.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleConfirmWeeklyBooking}
              disabled={isSubmitting || summary.totalDays === 0}
              className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Confirming Booking...</span>
                </>
              ) : (
                <span>Confirm 5-Day Booking</span>
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center mt-2">
              Individual days can still be cancelled prior to daily cutoff times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
