import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { kioskApi } from "../api/kioskApi";

/**
 * Custom hook to manage the self-service employee kiosk:
 * - RFID badge tap and session initiation
 * - Upcoming booking cancellations
 * - Next-day express meal pre-booking
 * - Customer wallet hold / balance oversight
 */
export function useSelfServiceKiosk() {
  const {
    sessionActive,
    startSession,
    endSession,
    exitTrigger,
    resetWatchdog,
  } = useOutletContext() || {};

  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Session Data
  const [employeeData, setEmployeeData] = useState(null);
  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings' | 'book_next_day' | 'wallet'

  // Next-Day Menu state
  const [nextDayMenu, setNextDayMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({}); // { [dayMenuId]: qty }
  const [bookingLoading, setBookingLoading] = useState(false);

  // Cancellation state
  const [cancellingId, setCancellingId] = useState(null);

  const inputRef = useRef(null);

  // Auto-focus input when in idle state
  useEffect(() => {
    if (!sessionActive) {
      setEmployeeData(null);
      setIdentifier("");
      setError(null);
      setSuccessMsg(null);
      setSelectedItems({});
      inputRef.current?.focus();
    }
  }, [sessionActive, exitTrigger]);

  // Handle RFID Card Tap / Scan
  const handleScan = async (e) => {
    e?.preventDefault?.();
    const cleanId = identifier.trim();
    if (!cleanId || loading) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await kioskApi.scanSelfService({ PIDENTIFIER: cleanId });
      const payload = res.data?.DATA || res.data;
      setEmployeeData(payload);
      startSession?.();
      setIdentifier("");
      setActiveTab("bookings");
    } catch (err) {
      const correlationId =
        err.correlationId || err.response?.headers?.["x-correlation-id"];
      setError({
        message:
          err.response?.data?.MESSAGE ||
          err.response?.data?.message ||
          "Card scan failed. Please verify your RFID card or login ID.",
        correlationId,
      });
      setIdentifier("");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tomorrow's menu when entering booking tab
  const loadNextDayMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const res = await kioskApi.getNextDayMenu();
      setNextDayMenu(res.data?.DATA || res.data);
    } catch (err) {
      console.error("Failed to load next day menu", err);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "book_next_day" && !nextDayMenu) {
      loadNextDayMenu();
    }
  }, [activeTab, nextDayMenu, loadNextDayMenu]);

  // Item quantity toggle
  const handleQuantityChange = (item, delta) => {
    resetWatchdog?.();
    setSelectedItems((prev) => {
      const current = prev[item.dayMenuId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[item.dayMenuId];
        return copy;
      }
      return { ...prev, [item.dayMenuId]: next };
    });
  };

  // Submit next-day pre-booking
  const handleConfirmBooking = async (service) => {
    resetWatchdog?.();
    const itemsToBook = Object.entries(selectedItems)
      .map(([dayMenuId, qty]) => {
        const menuItem = service.items.find(
          (i) => String(i.dayMenuId) === String(dayMenuId)
        );
        return menuItem
          ? {
              DAYMENUID: Number(dayMenuId),
              MENUITEMID: menuItem.menuItemId,
              QTY: qty,
            }
          : null;
      })
      .filter(Boolean);

    if (itemsToBook.length === 0) {
      alert("Please select at least one dish portion to book.");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await kioskApi.bookNextDay({
        CUSTOMERID: employeeData.customer.customerId,
        SERVICEID: service.serviceId,
        SERVICEDATE: nextDayMenu.targetDate,
        ITEMS: itemsToBook,
      });

      const bookNo = res.data?.DATA?.BOOKNO || "Confirmed";
      setSuccessMsg(`✓ Meal booked successfully for tomorrow! Order: ${bookNo}`);
      setSelectedItems({});

      // Refresh customer bookings
      const refreshRes = await kioskApi.scanSelfService({
        PIDENTIFIER:
          employeeData.customer.loginId ||
          String(employeeData.customer.customerId),
      });
      setEmployeeData(refreshRes.data?.DATA || refreshRes.data);
      setActiveTab("bookings");
    } catch (err) {
      const msg =
        err.response?.data?.MESSAGE ||
        err.response?.data?.message ||
        "Booking failed. Please try again.";
      const ref =
        err.correlationId || err.response?.headers?.["x-correlation-id"];
      alert(ref ? `${msg}\n\nReference ID: ${ref}` : msg);
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel active booking
  const handleCancelBooking = async (bookingId) => {
    resetWatchdog?.();
    if (
      !window.confirm(
        "Are you sure you want to cancel this booking? Reserved wallet funds will be released."
      )
    ) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await kioskApi.cancelBooking({
        BOOKINGID: bookingId,
        CUSTOMERID: employeeData.customer.customerId,
      });

      setSuccessMsg("✓ Booking cancelled successfully.");

      // Refresh employee bookings
      const refreshRes = await kioskApi.scanSelfService({
        PIDENTIFIER:
          employeeData.customer.loginId ||
          String(employeeData.customer.customerId),
      });
      setEmployeeData(refreshRes.data?.DATA || refreshRes.data);
    } catch (err) {
      const msg =
        err.response?.data?.MESSAGE ||
        err.response?.data?.message ||
        "Failed to cancel booking. The cancellation window may have closed.";
      const ref =
        err.correlationId || err.response?.headers?.["x-correlation-id"];
      alert(ref ? `${msg}\n\nReference ID: ${ref}` : msg);
    } finally {
      setCancellingId(null);
    }
  };

  return {
    sessionActive,
    startSession,
    endSession,
    resetWatchdog,
    identifier,
    setIdentifier,
    loading,
    error,
    successMsg,
    employeeData,
    activeTab,
    setActiveTab,
    nextDayMenu,
    menuLoading,
    selectedItems,
    bookingLoading,
    cancellingId,
    inputRef,
    handleScan,
    loadNextDayMenu,
    handleQuantityChange,
    handleConfirmBooking,
    handleCancelBooking,
  };
}
