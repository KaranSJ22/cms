import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { resolveBooking, serveBooking, serveBookingItem } from "../../booking/api/bookingApi";
import { kioskApi } from "../api/kioskApi";

/**
 * Custom hook to manage the serving terminal kiosk state:
 * - Canteen facility selection and discovery
 * - Shift authentication for staff
 * - Meal slot schedules and manual overrides
 * - RFID scanner input and booking resolution
 * - Booking item / full order dispensing actions
 */
export function useServingTerminal() {
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

  const isFutureBookingHeader = (booking) => {
    const bookingDateStr = booking?.HEADER?.SERVICEDATE?.slice(0, 10);
    if (!bookingDateStr) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return bookingDateStr > todayStr;
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

      const bookingDateStr = data.HEADER.SERVICEDATE?.slice(0, 10);
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const isFutureBooking = Boolean(bookingDateStr && bookingDateStr > todayStr);

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
      } else if (isFutureBooking) {
        setError({
          message: `⛔ Future Booking: This order (${data.HEADER.BOOKNO}) is scheduled for ${bookingDateStr}. Dispensing is disabled until the day of service.`,
        });
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

    if (isFutureBookingHeader(activeBooking)) {
      setError({
        message: `Cannot dispense future booking before scheduled service date (${activeBooking.HEADER.SERVICEDATE?.slice(0, 10)}).`,
      });
      return;
    }

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
    if (!activeBooking?.HEADER?.BOOKID || actionLoading) return;

    if (isFutureBookingHeader(activeBooking)) {
      setError({
        message: `Cannot dispense item from future booking before scheduled date (${activeBooking.HEADER.SERVICEDATE?.slice(0, 10)}).`,
      });
      return;
    }

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

  return {
    user,
    canteens,
    selectedCanteenId,
    setSelectedCanteenId,
    currentCanteenObj,
    canteenLabel,
    shiftLoginId,
    setShiftLoginId,
    shiftPassword,
    setShiftPassword,
    shiftLoginLoading,
    shiftLoginError,
    handleShiftLogin,
    todaySlots,
    manualSlotId,
    setManualSlotId,
    currentSlot,
    loadTodaySlots,
    loadCurrentSlot,
    identifier,
    setIdentifier,
    activeBooking,
    setActiveBooking,
    loading,
    actionLoading,
    error,
    successMsg,
    inputRef,
    handleResolve,
    handleServeAll,
    handleServeItem,
    handleClear,
    isFutureBookingHeader,
    setActiveCanteenId,
  };
}
