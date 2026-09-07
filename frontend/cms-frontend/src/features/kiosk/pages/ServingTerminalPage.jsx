import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { resolveBooking, serveBooking, serveBookingItem } from "../../booking/api/bookingApi";
import { kioskApi } from "../api/kioskApi";
import { LockClosedIcon, ComputerDesktopIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";

export default function ServingTerminalPage() {
  const { user, activeCanteen, activeCanteenId, setActiveCanteenId, login } = useAuth();

  // Canteen Facility Discovery
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState(() => {
    const saved = localStorage.getItem("cms_kiosk_canteen_id");
    return saved ? Number(saved) : (activeCanteenId || 1);
  });

  // Shift Login State (if not yet authenticated)
  const [shiftLoginId, setShiftLoginId] = useState("");
  const [shiftPassword, setShiftPassword] = useState("");
  const [shiftLoginLoading, setShiftLoginLoading] = useState(false);
  const [shiftLoginError, setShiftLoginError] = useState(null);

  // Scheduled Slots & Flexible Service Selector State
  const [todaySlots, setTodaySlots] = useState([]);
  const [manualSlotId, setManualSlotId] = useState(null); // null = Auto-detect, number = DAYSLOTID, 'ALL' = Any booking
  const [currentSlot, setCurrentSlot] = useState(null);

  // Scanner & Serving State
  const [identifier, setIdentifier] = useState("");
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const inputRef = useRef(null);

  // 1. Fetch available canteens on mount
  useEffect(() => {
    kioskApi
      .getCanteens()
      .then((res) => {
        const list = res.data?.DATA || [];
        setCanteens(list);
        if (list.length > 0) {
          const saved = localStorage.getItem("cms_kiosk_canteen_id");
          const initialId = saved
            ? Number(saved)
            : activeCanteenId || list[0].CANTEENID;
          setSelectedCanteenId(initialId);
        }
      })
      .catch((err) => console.warn("Could not load canteens for terminal", err));
  }, [activeCanteenId]);

  // 2. Fetch today's scheduled meal slots for the selected canteen
  const loadTodaySlots = useCallback(async () => {
    if (!selectedCanteenId) return;
    try {
      const res = await kioskApi.getTodaySlots(selectedCanteenId);
      setTodaySlots(res.data?.DATA || []);
    } catch (err) {
      console.warn("Could not load today's slots", err);
    }
  }, [selectedCanteenId]);

  useEffect(() => {
    if (user && selectedCanteenId) {
      loadTodaySlots();
    }
  }, [user, selectedCanteenId, loadTodaySlots]);

  // 3. Monitor active meal slot based on current clock time
  const loadCurrentSlot = useCallback(async () => {
    if (!selectedCanteenId) return;
    try {
      const res = await kioskApi.getCurrentSlot(selectedCanteenId);
      setCurrentSlot(res.data?.DATA || null);
    } catch (err) {
      console.warn("Could not fetch active slot for kiosk", err);
    }
  }, [selectedCanteenId]);

  useEffect(() => {
    if (user && selectedCanteenId) {
      loadCurrentSlot();
      const interval = setInterval(loadCurrentSlot, 60000);
      return () => clearInterval(interval);
    }
  }, [user, selectedCanteenId, loadCurrentSlot]);

  // Auto-focus input on mount and after actions
  useEffect(() => {
    if (user) {
      inputRef.current?.focus();
    }
  }, [user, activeBooking, error, successMsg]);

  // Handle Shift Login with explicit Canteen selection
  const handleShiftLogin = async (e) => {
    e.preventDefault();
    if (!shiftLoginId.trim() || !shiftPassword) return;

    setShiftLoginLoading(true);
    setShiftLoginError(null);

    try {
      const loggedUser = await login(shiftLoginId.trim(), shiftPassword);
      const roles = loggedUser?.CANTEENROLES || [];
      const isSysAdmin = loggedUser?.SYSTEMROLES?.includes("SYSADM");
      const hasStaffRole =
        isSysAdmin ||
        roles.some((r) => r.ROLECODE === "CNTSTF" || r.ROLECODE === "CNTMGR");

      if (!hasStaffRole) {
        setShiftLoginError(
          "Access Denied: This terminal requires a Canteen Staff (CNTSTF) or Manager (CNTMGR) account."
        );
        return;
      }

      // Ensure active canteen is set and persisted
      const isAssigned =
        isSysAdmin || roles.some((r) => r.CANTEENID === selectedCanteenId);
      if (!isAssigned && roles.length > 0) {
        const fallbackCanteen = roles[0].CANTEENID;
        setSelectedCanteenId(fallbackCanteen);
        localStorage.setItem("cms_kiosk_canteen_id", String(fallbackCanteen));
        if (setActiveCanteenId) setActiveCanteenId(fallbackCanteen);
      } else {
        localStorage.setItem("cms_kiosk_canteen_id", String(selectedCanteenId));
        if (setActiveCanteenId) setActiveCanteenId(selectedCanteenId);
      }
    } catch (err) {
      setShiftLoginError({
        message:
          err.response?.data?.MESSAGE ||
          err.response?.data?.message ||
          "Invalid staff credentials. Please try again.",
        correlationId:
          err.correlationId || err.response?.headers?.["x-correlation-id"],
      });
    } finally {
      setShiftLoginLoading(false);
    }
  };

  // Resolve booking on scan/enter with flexible slot support
  const handleResolve = async (e) => {
    e?.preventDefault?.();
    if (!identifier.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setActiveBooking(null);

    try {
      const targetDaySlotId =
        manualSlotId === "ALL"
          ? null
          : manualSlotId || currentSlot?.DAYSLOTID || null;

      const data = await resolveBooking(identifier.trim(), {
        canteenId: selectedCanteenId,
        daySlotId: targetDaySlotId,
      });
      setActiveBooking(data);

      if (data.HEADER.STATUSCODE === "SRV") {
        const servedTime = data.HEADER.SERVEDON
          ? new Date(data.HEADER.SERVEDON).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        const servedBy =
          data.HEADER.SERVEDBYNAME || `User #${data.HEADER.SERVEDBY}`;
        setSuccessMsg(
          `ℹ️ Notice: This booking was already marked SERVED ${
            servedTime ? `at ${servedTime}` : ""
          } by ${servedBy}.`
        );
      } else if (data.HEADER.ISINWINDOW === 0) {
        const slotName = data.HEADER.SERVNAME || "another meal service";
        const start = data.HEADER.SLOTSTARTTIME
          ? data.HEADER.SLOTSTARTTIME.substring(0, 5)
          : "";
        const end = data.HEADER.SLOTENDTIME
          ? data.HEADER.SLOTENDTIME.substring(0, 5)
          : "";
        setSuccessMsg(
          `ℹ️ Notice: Late arrival / Outside nominal window for ${slotName} (${start} – ${end}). Dispensing is enabled.`
        );
      }
    } catch (err) {
      setError({
        message:
          err.response?.data?.message ||
          err.response?.data?.MESSAGE ||
          "No active booking found for this identifier in this canteen facility.",
        correlationId:
          err.correlationId || err.response?.headers?.["x-correlation-id"],
      });
    } finally {
      setLoading(false);
      setIdentifier("");
    }
  };

  // Serve entire booking
  const handleServeAll = async () => {
    if (!activeBooking?.HEADER?.BOOKID || actionLoading) return;

    setActionLoading(true);
    setError(null);

    try {
      await serveBooking(activeBooking.HEADER.BOOKID);
      setSuccessMsg(
        `✓ Booking ${activeBooking.HEADER.BOOKNO} marked as fully SERVED. Operator attribution recorded.`
      );
      setActiveBooking(null);
    } catch (err) {
      setError({
        message:
          err.response?.data?.message ||
          err.response?.data?.MESSAGE ||
          "Failed to mark booking as served.",
        correlationId:
          err.correlationId || err.response?.headers?.["x-correlation-id"],
      });
    } finally {
      setActionLoading(false);
      inputRef.current?.focus();
    }
  };

  // Serve single booking item
  const handleServeItem = async (itemId) => {
    if (!activeBooking?.HEADER?.BOOKID) return;

    setActionLoading(true);
    setError(null);

    try {
      await serveBookingItem(activeBooking.HEADER.BOOKID, itemId);

      setActiveBooking((prev) => {
        if (!prev) return null;
        const updatedItems = prev.ITEMS.map((item) =>
          item.BOOKITEMID === itemId ? { ...item, STATUSCODE: "SRV" } : item
        );
        const allServed = updatedItems.every(
          (item) => item.STATUSCODE === "SRV"
        );
        return {
          ...prev,
          HEADER: {
            ...prev.HEADER,
            STATUSCODE: allServed ? "SRV" : prev.HEADER.STATUSCODE,
          },
          ITEMS: updatedItems,
        };
      });
    } catch (err) {
      setError({
        message:
          err.response?.data?.message ||
          err.response?.data?.MESSAGE ||
          "Failed to mark item as served.",
        correlationId:
          err.correlationId || err.response?.headers?.["x-correlation-id"],
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClear = () => {
    setActiveBooking(null);
    setError(null);
    setSuccessMsg(null);
    setIdentifier("");
    inputRef.current?.focus();
  };

  const currentCanteenObj =
    canteens.find((c) => c.CANTEENID === selectedCanteenId) ||
    activeCanteen ||
    null;
  const canteenLabel =
    currentCanteenObj?.CANTEENNAME || `Canteen Facility #${selectedCanteenId}`;

  // ------------------------------------------------------------
  // Case A: Operator not logged in -> Show Staff Shift Login Card with Canteen Selector
  // ------------------------------------------------------------
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-950 font-inter">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
            <LockClosedIcon className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white font-grotesk tracking-tight">
              Staff Shift Sign-In
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your Canteen Facility and sign in with staff credentials to
              unlock this terminal.
            </p>
          </div>

          {shiftLoginError && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-600/80 text-rose-200 rounded-xl text-xs font-bold text-left animate-in fade-in">
              <p>
                {typeof shiftLoginError === "object"
                  ? shiftLoginError.message
                  : shiftLoginError}
              </p>
              {typeof shiftLoginError === "object" &&
                shiftLoginError.correlationId && (
                  <p className="text-[0.68rem] font-mono text-rose-400 mt-1 font-normal tracking-wide">
                    Ref ID: {shiftLoginError.correlationId}
                  </p>
                )}
            </div>
          )}

          <form onSubmit={handleShiftLogin} className="space-y-4 text-left">
            {/* Canteen Facility Dropdown */}
            <div>
              <label className="block text-[0.7rem] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                <BuildingStorefrontIcon className="w-4 h-4 text-orange-400" />
                <span>Canteen Facility</span>
              </label>
              <select
                value={selectedCanteenId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedCanteenId(id);
                  localStorage.setItem("cms_kiosk_canteen_id", String(id));
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {canteens.map((c) => (
                  <option key={c.CANTEENID} value={c.CANTEENID}>
                    {c.CANTEENNAME} ({c.CANTEENCODE}){" "}
                    {c.LOCATION ? `• ${c.LOCATION}` : ""}
                  </option>
                ))}
                {canteens.length === 0 && (
                  <option value={selectedCanteenId}>
                    Canteen Facility #{selectedCanteenId}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[0.7rem] uppercase font-bold text-slate-400 mb-1">
                Staff Login ID
              </label>
              <input
                type="text"
                value={shiftLoginId}
                onChange={(e) => setShiftLoginId(e.target.value)}
                placeholder="e.g. staff1"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] uppercase font-bold text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={shiftPassword}
                onChange={(e) => setShiftPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={shiftLoginLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-400 text-slate-950 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {shiftLoginLoading
                ? "Authenticating Shift..."
                : "Start Shift & Unlock Scanner"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Case B: Operator Logged In -> High-Throughput Dispensing Screen
  // ------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 select-none font-inter bg-slate-950 text-slate-100">
      {/* Terminal Sub-Bar with Operator Info & Canteen Switcher */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight text-white font-grotesk">
              Serving Terminal
            </h1>

            {/* Quick Canteen Facility Switcher */}
            {canteens.length > 1 ? (
              <select
                value={selectedCanteenId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedCanteenId(id);
                  localStorage.setItem("cms_kiosk_canteen_id", String(id));
                  if (setActiveCanteenId) setActiveCanteenId(id);
                  handleClear();
                }}
                className="bg-slate-900 border border-orange-500/40 text-orange-400 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer hover:border-orange-400 transition-colors"
                title="Switch Canteen Facility"
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
            ) : (
              <span className="px-2.5 py-0.5 rounded text-[0.68rem] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {canteenLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan Employee RFID badge or type Employee ID / Booking Number
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Scanner Ready (RC522)</span>
          </div>
        </div>
      </div>

      {/* Main Dispensing Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-4">
        {/* Flexible Meal Service Selector Bar */}
        <div className="w-full mb-3 flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[0.68rem] uppercase font-bold text-slate-400 px-2 flex items-center gap-1">
            <span>Meal Mode:</span>
          </span>

          {/* Auto-detect button */}
          <button
            type="button"
            onClick={() => setManualSlotId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              manualSlotId === null
                ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20 ring-1 ring-orange-400"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <span>🕒 Auto-Detect</span>
          </button>

          {/* Dynamic buttons for each scheduled slot today */}
          {todaySlots.map((slot) => {
            const isSelected = manualSlotId === slot.DAYSLOTID;
            return (
              <button
                key={slot.DAYSLOTID}
                type="button"
                onClick={() => setManualSlotId(slot.DAYSLOTID)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400"
                    : slot.ISCURRENT
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>{slot.SERVNAME}</span>
                <span className="font-mono text-[0.65rem] opacity-75">
                  ({slot.STARTTIME?.substring(0, 5)}–
                  {slot.ENDTIME?.substring(0, 5)})
                </span>
                {slot.ISCURRENT && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}

          {/* Flexible Any Service Override */}
          <button
            type="button"
            onClick={() => setManualSlotId("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              manualSlotId === "ALL"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <span>🌐 All Bookings (Flexible)</span>
          </button>
        </div>

        {/* Live Meal Slot Indicator & Manual Mode Banner */}
        <div className="w-full mb-3">
          {manualSlotId && manualSlotId !== "ALL" ? (
            (() => {
              const lockedSlot = todaySlots.find(
                (s) => s.DAYSLOTID === manualSlotId
              );
              return (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 text-xs font-semibold shadow-lg shadow-emerald-950/30 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="font-bold uppercase tracking-wider text-emerald-300">
                      MANUAL SERVICE OVERRIDE:
                    </span>
                    <span className="text-white font-black text-sm">
                      {lockedSlot?.SERVNAME || "Selected Meal Service"}
                    </span>
                    <span className="text-emerald-400/80 font-mono">
                      ({lockedSlot?.STARTTIME?.substring(0, 5)} –{" "}
                      {lockedSlot?.ENDTIME?.substring(0, 5)})
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="bg-emerald-800/60 text-emerald-100 px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold">
                      Late arrivals allowed
                    </span>
                  </div>
                </div>
              );
            })()
          ) : manualSlotId === "ALL" ? (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-purple-950/70 border-2 border-purple-500 text-purple-200 text-xs font-semibold shadow-lg">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="font-bold uppercase text-purple-300">
                  FLEXIBLE MODE ACTIVE:
                </span>
                <span className="text-white font-bold">
                  Dispensing ANY valid booking for today
                </span>
              </span>
              <span className="text-purple-300/80 text-[0.7rem]">
                No slot restriction
              </span>
            </div>
          ) : currentSlot?.ISACTIVENOW ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-bold uppercase tracking-wider text-emerald-300">
                  ACTIVE MEAL SERVICE:
                </span>
                <span className="text-white font-black text-sm">
                  {currentSlot.SERVNAME}
                </span>
                <span className="text-emerald-400/80 font-mono">
                  ({currentSlot.STARTTIME?.substring(0, 5)} –{" "}
                  {currentSlot.ENDTIME?.substring(0, 5)})
                </span>
              </div>
              <div className="text-xs">
                <span className="text-emerald-400/70">Window Closes In: </span>
                <span className="font-mono font-bold text-white">
                  {currentSlot.MINUTESREMAINING} mins
                </span>
              </div>
            </div>
          ) : currentSlot?.SLOTSTATE === "UPCOMING" ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-950/20">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="font-bold uppercase tracking-wider text-amber-300">
                  UPCOMING SERVICE:
                </span>
                <span className="text-white font-bold text-sm">
                  {currentSlot.SERVNAME}
                </span>
                <span className="text-amber-400/80 font-mono">
                  (Starts {currentSlot.STARTTIME?.substring(0, 5)})
                </span>
              </div>
              <div className="text-xs">
                <span className="text-amber-300/70">Opens In: </span>
                <span className="font-mono font-bold text-white">
                  {currentSlot.MINUTESUNTILSTART} mins
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>No active meal slot running currently</span>
              </span>
              <span className="text-slate-500 text-[0.7rem]">
                Select a slot above or scan to auto-resolve
              </span>
            </div>
          )}
        </div>

        {/* Hardware / Barcode Scanner Input */}
        <form onSubmit={handleResolve} className="w-full mb-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading || actionLoading}
              placeholder="SCAN RFID / ENTER ID"
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-5 text-3xl font-mono text-center uppercase tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all disabled:opacity-50"
              autoComplete="off"
            />
            {loading && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <div className="w-7 h-7 border-3 border-slate-500 border-t-orange-400 rounded-full animate-spin" />
              </div>
            )}
            <button type="submit" className="hidden" />
          </div>
        </form>

        {/* Feedback Alerts */}
        {error && (
          <div className="w-full mb-4 p-4 bg-rose-950/80 border-2 border-rose-600 text-rose-200 rounded-2xl text-center font-bold text-lg animate-in fade-in">
            <p>{typeof error === "object" ? error.message : error}</p>
            {typeof error === "object" && error.correlationId && (
              <p className="text-xs font-mono text-rose-400 mt-1.5 font-normal tracking-wide">
                Ref ID: {error.correlationId}
              </p>
            )}
          </div>
        )}
        {successMsg && (
          <div className="w-full mb-4 p-4 bg-emerald-950/80 border-2 border-emerald-600 text-emerald-200 rounded-2xl text-center font-bold text-lg animate-in fade-in">
            {successMsg}
          </div>
        )}

        {/* Active Booking Card */}
        {activeBooking ? (
          <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Customer & Service Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                  {activeBooking.HEADER.BOOKTYPECODE === "PB"
                    ? "Pre-Booking"
                    : "Kiosk Booking"}
                </span>
                <p className="text-2xl md:text-3xl font-black text-white font-mono">
                  {activeBooking.HEADER.BOOKNO}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400">
                    Service:{" "}
                    <span className="text-slate-200 font-semibold">
                      {activeBooking.HEADER.SERVNAME ||
                        activeBooking.HEADER.SERVICEID}
                    </span>
                  </p>
                  {activeBooking.HEADER.SLOTSTARTTIME && (
                    <span className="text-[0.7rem] text-slate-400 font-mono">
                      ({activeBooking.HEADER.SLOTSTARTTIME.substring(0, 5)} –{" "}
                      {activeBooking.HEADER.SLOTENDTIME?.substring(0, 5)})
                    </span>
                  )}
                  {activeBooking.HEADER.ISINWINDOW === 0 && (
                    <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Out of Window (Late Arrival)
                    </span>
                  )}
                  {activeBooking.HEADER.ISINWINDOW === 1 && (
                    <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active Window
                    </span>
                  )}
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Customer
                </span>
                <p className="text-xl md:text-2xl font-bold text-white">
                  {activeBooking.HEADER.CUSTOMERNAME}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {activeBooking.HEADER.LOGINID ||
                    `ID: ${activeBooking.HEADER.CUSTOMERID}`}
                </p>
              </div>
            </div>

            {/* Itemized Serving List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Booked Items ({activeBooking.ITEMS.length})
                </span>
                <span className="text-xs text-slate-400">
                  Click item to serve individually
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeBooking.ITEMS.map((item) => {
                  const isServed =
                    item.STATUSCODE === "SRV" || item.STATUSID === 32 || item.STATUSID === 31;
                  return (
                    <div
                      key={item.BOOKITEMID}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isServed
                          ? "bg-emerald-950/30 border-emerald-800/50 text-slate-400"
                          : "bg-slate-950 border-slate-800 text-white hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-lg">
                          x{item.QTY}
                        </span>
                        <div>
                          <p
                            className={`text-lg font-bold ${
                              isServed
                                ? "line-through text-slate-500"
                                : "text-white"
                            }`}
                          >
                            {item.ITEMNAME ||
                              item.SHORTNAME ||
                              `Item #${item.MENUITEMID}`}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            ₹
                            {Number(
                              item.AMOUNT || item.RATE * item.QTY
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isServed ? (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            ✓ Served
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleServeItem(item.BOOKITEMID)}
                            disabled={actionLoading}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 transition-all border border-slate-700"
                          >
                            Serve Item
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={actionLoading}
                className="flex-1 py-4 rounded-2xl font-bold text-base bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                Clear (Esc)
              </button>
              <button
                type="button"
                onClick={handleServeAll}
                disabled={
                  actionLoading ||
                  activeBooking.ITEMS.every((i) => i.STATUSCODE === "SRV")
                }
                className="flex-[2] py-4 rounded-2xl font-black text-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {actionLoading ? "Recording Serve..." : "SERVE ALL ITEMS"}
              </button>
            </div>
          </div>
        ) : (
          !loading &&
          !error && (
            <div className="text-center text-slate-500 py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <ComputerDesktopIcon className="w-10 h-10" />
              </div>
              <p className="text-xl font-bold text-slate-400">
                Ready for next customer
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Tap RFID card on reader or enter booking number above
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
