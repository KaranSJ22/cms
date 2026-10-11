import { useState, useEffect, useRef, useCallback } from "react";
import { kioskApi } from "../api/kioskApi";

const INACTIVITY_TIMEOUT_MS = 60000; // 60s auto-logout

export function useSelfServiceKiosk() {
  const [sessionActive, setSessionActive] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Employee Session Data
  const [employeeData, setEmployeeData] = useState(null);
  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings' | 'book_next_day' | 'wallet'

  // Pre-Booking State
  const [targetDate, setTargetDate] = useState("");
  const [availableServices, setAvailableServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceMenu, setServiceMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({}); // { [dayMenuId]: qty }
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Cancellation State
  const [cancellingId, setCancellingId] = useState(null);

  const inputRef = useRef(null);
  const watchdogTimerRef = useRef(null);

  // Inactivity Watchdog: Resets session after 60s of complete inactivity
  const resetWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    // Never auto-logout if booking request is in flight or confirmation modal is open
    if (sessionActive && !bookingLoading && !confirmation) {
      watchdogTimerRef.current = setTimeout(() => {
        handleEndSession();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [sessionActive, bookingLoading, confirmation]);

  // Comprehensive user activity listener to reset watchdog timer on any interaction
  useEffect(() => {
    if (!sessionActive) return;

    resetWatchdog();

    const handleActivity = () => resetWatchdog();
    const events = ["pointerdown", "pointermove", "touchstart", "touchmove", "click", "keydown", "wheel", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, [sessionActive, resetWatchdog]);

  const handleEndSession = () => {
    setSessionActive(false);
    setEmployeeData(null);
    setIdentifier("");
    setError(null);
    setSelectedItems({});
    setSelectedService(null);
    setServiceMenu(null);
    setConfirmation(null);
    inputRef.current?.focus();
  };

  // Auto-focus input when in idle state
  useEffect(() => {
    if (!sessionActive) {
      handleEndSession();
      inputRef.current?.focus();
    }
  }, [sessionActive]);

  // Handle Card Tap / Scan
  const handleScan = async (e, overrideId = null) => {
    e?.preventDefault?.();
    const cleanId = (overrideId !== null ? overrideId : identifier).trim();
    if (!cleanId || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await kioskApi.scanSelfService({ PIDENTIFIER: cleanId });
      const payload = res.data?.DATA || res.data;
      setEmployeeData(payload);
      setSessionActive(true);
      setIdentifier("");
      setActiveTab("bookings");
      loadNextDayServices();
    } catch (err) {
      setError({
        message:
          err.response?.data?.MESSAGE ||
          err.message ||
          "Card scan failed. Please verify your badge.",
      });
      setIdentifier("");
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Load Tomorrow's Services
  const loadNextDayServices = async () => {
    setServicesLoading(true);
    try {
      const res = await kioskApi.getNextDayServices();
      const payload = res.data?.DATA || res.data;
      setTargetDate(payload.targetDate);
      setAvailableServices(payload.services || []);
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setServicesLoading(false);
    }
  };

  // Select Meal Service (e.g. Lunch)
  const handleSelectService = async (service) => {
    setSelectedService(service);
    setMenuLoading(true);
    try {
      const res = await kioskApi.getNextDayMenu({ serviceId: service.serviceId });
      const payload = res.data?.DATA || res.data;
      const found = (payload.services || []).find((s) => s.serviceId === service.serviceId);
      setServiceMenu(found || { items: [] });
    } catch (err) {
      console.error("Failed to load menu:", err);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleBackToServices = () => {
    setSelectedService(null);
    setServiceMenu(null);
    setSelectedItems({});
  };

  const handleQuantityChange = (dayMenuId, delta) => {
    setSelectedItems((prev) => {
      const current = prev[dayMenuId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[dayMenuId];
        return copy;
      }
      return { ...prev, [dayMenuId]: next };
    });
  };

  // Submit Pre-Booking
  const handleConfirmBooking = async () => {
    if (!employeeData || !selectedService) return;

    const items = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([dayMenuId, qty]) => {
        const dish = serviceMenu?.items?.find((i) => i.dayMenuId === Number(dayMenuId));
        return {
          dayMenuId: Number(dayMenuId),
          menuItemId: dish ? dish.menuItemId : Number(dayMenuId),
          qty,
        };
      });

    if (items.length === 0) return;

    setBookingLoading(true);
    try {
      const res = await kioskApi.bookNextDay({
        CUSTOMERID: employeeData.customer.customerId,
        SERVICEID: selectedService.serviceId,
        SERVICEDATE: targetDate,
        ITEMS: items,
      });

      const payload = res.data?.DATA || res.data;
      setConfirmation({
        ...payload,
        serviceName: selectedService.serviceName,
        serviceDate: targetDate,
        customerName: employeeData.customer.displayName,
        loginId: employeeData.customer.loginId,
        itemsSummary: items.map((it) => {
          const dish = serviceMenu?.items?.find((i) => i.dayMenuId === it.dayMenuId);
          return { name: dish ? dish.itemName : "Meal Item", qty: it.qty };
        }),
      });
      setSelectedItems({});
      handleBackToServices();

      // Refresh employee profile
      handleScan(null, String(employeeData.customer.customerId));
    } catch (err) {
      setError({
        message: err.response?.data?.MESSAGE || err.message || "Failed to confirm booking",
      });
      setTimeout(() => setError(null), 5000);
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel Pre-Booking
  const handleCancelBooking = async (bookId) => {
    if (!employeeData || cancellingId) return;

    setCancellingId(bookId);
    try {
      await kioskApi.cancelBooking({
        BOOKINGID: String(bookId),
        CUSTOMERID: employeeData.customer.customerId,
      });
      // Refresh profile
      handleScan(null, String(employeeData.customer.customerId));
    } catch (err) {
      setError({
        message: err.response?.data?.MESSAGE || err.message || "Cancellation failed",
      });
      setTimeout(() => setError(null), 4000);
    } finally {
      setCancellingId(null);
    }
  };

  const isServiceBooked = (serviceId) => {
    const list = employeeData?.upcomingBookings || [];
    return list.some((b) => b.serviceId === serviceId && b.serviceDate === targetDate);
  };

  return {
    sessionActive,
    handleEndSession,
    identifier,
    setIdentifier,
    loading,
    error,
    employeeData,
    activeTab,
    setActiveTab,
    targetDate,
    availableServices,
    servicesLoading,
    selectedService,
    serviceMenu,
    menuLoading,
    selectedItems,
    bookingLoading,
    confirmation,
    setConfirmation,
    cancellingId,
    inputRef,
    handleScan,
    handleSelectService,
    handleBackToServices,
    handleQuantityChange,
    handleConfirmBooking,
    handleCancelBooking,
    isServiceBooked,
  };
}
