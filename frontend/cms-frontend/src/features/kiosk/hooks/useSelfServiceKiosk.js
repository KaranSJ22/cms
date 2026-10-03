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

  // Next-Day Services & Menu state
  const [availableServices, setAvailableServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [targetDate, setTargetDate] = useState(getTomorrowStr);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceMenu, setServiceMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({}); // { [dayMenuId]: qty }
  const [bookingLoading, setBookingLoading] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null); // active booking being modified

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
      setSelectedService(null);
      setServiceMenu(null);
      setAvailableServices([]);
      setEditingBooking(null);
      inputRef.current?.focus();
    }
  }, [sessionActive, exitTrigger]);

  // Handle RFID Card Tap / Scan
  const handleScan = async (e, overrideId = null) => {
    e?.preventDefault?.();
    const cleanId = (overrideId !== null ? overrideId : identifier).trim();
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

  // Fetch tomorrow's available services
  const loadNextDayServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const res = await kioskApi.getNextDayServices();
      const data = res.data?.DATA || res.data;
      setAvailableServices(data?.services || []);
      setTargetDate(data?.targetDate || "");
    } catch (err) {
      console.error("Failed to load next day services", err);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "book_next_day" && availableServices.length === 0) {
      loadNextDayServices();
    }
  }, [activeTab, availableServices.length, loadNextDayServices]);

  // Select a service and load only its menu items
  const handleSelectService = async (service) => {
    resetWatchdog?.();
    setSelectedService(service);
    setSelectedItems({});
    setMenuLoading(true);
    try {
      const res = await kioskApi.getNextDayMenu(undefined, service.serviceId);
      const data = res.data?.DATA || res.data;
      const found = (data?.services || []).find((s) => s.serviceId === service.serviceId) || data?.services?.[0];
      setServiceMenu(found || { ...service, items: [] });
      if (data?.targetDate) {
        setTargetDate(data.targetDate);
      }
    } catch (err) {
      console.error("Failed to load menu for service", err);
      setError({ message: "Failed to load menu items for " + service.serviceName });
      setTimeout(() => setError(null), 4000);
    } finally {
      setMenuLoading(false);
    }
  };

  // Return to services list
  const handleBackToServices = () => {
    resetWatchdog?.();
    setSelectedService(null);
    setServiceMenu(null);
    setSelectedItems({});
    setEditingBooking(null);
  };

  // Start editing an active booking
  const handleStartEditBooking = async (booking) => {
    resetWatchdog?.();
    setError(null);
    setEditingBooking(booking);
    setActiveTab("book_next_day");
    setSelectedItems({});
    setMenuLoading(true);

    try {
      // 1. Fetch menu for this service
      const menuRes = await kioskApi.getNextDayMenu(undefined, booking.SERVICEID);
      const menuData = menuRes.data?.DATA || menuRes.data;
      const found =
        (menuData?.services || []).find(
          (s) => Number(s.serviceId) === Number(booking.SERVICEID)
        ) || menuData?.services?.[0];

      const sObj = found || {
        serviceId: booking.SERVICEID,
        serviceName: booking.SERVNAME,
        startTime: booking.STARTTIME,
        endTime: booking.ENDTIME,
        items: [],
      };
      setSelectedService(sObj);
      setServiceMenu(sObj);
      if (menuData?.targetDate) {
        setTargetDate(menuData.targetDate);
      }

      // 2. Fetch existing booking details and pre-populate quantities
      const detailsRes = await kioskApi.getBookingDetails(
        booking.BOOKID,
        employeeData.customer.customerId
      );
      const detailsData = detailsRes.data?.DATA || detailsRes.data;
      const existingItems = detailsData?.items || [];
      const qtyMap = {};
      existingItems.forEach((i) => {
        qtyMap[i.DAYMENUID] = Number(i.QTY || 1);
      });
      setSelectedItems(qtyMap);
    } catch (err) {
      console.error("Failed to load booking for edit", err);
      const msg =
        err.response?.data?.MESSAGE ||
        err.response?.data?.message ||
        "Failed to load booking items for editing";
      setError({ message: msg });
      setTimeout(() => setError(null), 5000);
      setEditingBooking(null);
    } finally {
      setMenuLoading(false);
    }
  };

  // Check if a service is already booked for tomorrow by this employee
  const isServiceBooked = useCallback(
    (serviceId) => {
      const upcoming = employeeData?.upcomingBookings || [];
      return upcoming.some(
        (b) =>
          Number(b.SERVICEID) === Number(serviceId) &&
          (b.STATUSCODE === "CRT" || b.STATUSID === 30) &&
          (!targetDate || b.SERVICEDATE?.slice(0, 10) === targetDate)
      );
    },
    [employeeData, targetDate]
  );

  // Get active booking details for a service
  const getServiceBooking = useCallback(
    (serviceId) => {
      const upcoming = employeeData?.upcomingBookings || [];
      return upcoming.find(
        (b) =>
          Number(b.SERVICEID) === Number(serviceId) &&
          (b.STATUSCODE === "CRT" || b.STATUSID === 30) &&
          (!targetDate || b.SERVICEDATE?.slice(0, 10) === targetDate)
      );
    },
    [employeeData, targetDate]
  );

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

  // Submit next-day pre-booking or update existing booking
  const handleConfirmBooking = async (service) => {
    resetWatchdog?.();
    const effectiveService =
      (service?.items ? service : null) ||
      (serviceMenu?.items ? serviceMenu : null) ||
      service ||
      selectedService;

    if (!effectiveService) return;

    if (!editingBooking && isServiceBooked(effectiveService.serviceId)) {
      setError({
        message: `You already have an active booking for ${effectiveService.serviceName} tomorrow. Use Edit to change your dishes.`,
      });
      setTimeout(() => setError(null), 5000);
      return;
    }

    const allItems = effectiveService.items || serviceMenu?.items || [];
    const itemsToBook = Object.entries(selectedItems)
      .map(([dayMenuId, qty]) => {
        if (!qty || qty <= 0) return null;
        const menuItem = allItems.find(
          (i) => String(i.dayMenuId) === String(dayMenuId)
        );
        return menuItem
          ? {
              DAYMENUID: Number(dayMenuId),
              MENUITEMID: menuItem.menuItemId,
              QTY: Number(qty),
            }
          : null;
      })
      .filter(Boolean);

    if (itemsToBook.length === 0) {
      setError({ message: "Please select at least one dish portion to book." });
      setTimeout(() => setError(null), 4000);
      return;
    }

    setBookingLoading(true);
    try {
      if (editingBooking) {
        await kioskApi.updateBooking({
          BOOKINGID: editingBooking.BOOKID,
          CUSTOMERID: employeeData.customer.customerId,
          ITEMS: itemsToBook,
        });

        setSuccessMsg(`✓ Order #${editingBooking.BOOKNO} updated successfully!`);
      } else {
        const res = await kioskApi.bookNextDay({
          CUSTOMERID: employeeData.customer.customerId,
          SERVICEID: effectiveService.serviceId,
          SERVICEDATE: targetDate || effectiveService.serviceDate || serviceMenu?.serviceDate,
          ITEMS: itemsToBook,
        });

        const bookNo = res.data?.DATA?.BOOKNO || "Confirmed";
        setSuccessMsg(`✓ Meal booked successfully for tomorrow! Order: ${bookNo}`);
      }

      setSelectedItems({});
      setSelectedService(null);
      setServiceMenu(null);
      setEditingBooking(null);

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
        "Operation failed. The cutoff time may have passed.";
      const ref =
        err.correlationId || err.response?.headers?.["x-correlation-id"];
      setError({ message: ref ? `${msg} (Ref: ${ref})` : msg });
      setTimeout(() => setError(null), 5000);
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel active booking
  const handleCancelBooking = async (bookingId) => {
    resetWatchdog?.();
    setCancellingId(bookingId);
    setError(null);
    try {
      await kioskApi.cancelBooking({
        BOOKINGID: bookingId,
        CUSTOMERID: employeeData.customer.customerId,
      });

      setSuccessMsg("✓ Booking cancelled successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);

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
      setError({ message: msg, correlationId: ref });
      setTimeout(() => setError(null), 5000);
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
    targetDate,
    availableServices,
    servicesLoading,
    loadNextDayServices,
    selectedService,
    serviceMenu,
    menuLoading,
    selectedItems,
    bookingLoading,
    cancellingId,
    inputRef,
    handleScan,
    handleSelectService,
    handleBackToServices,
    handleQuantityChange,
    handleConfirmBooking,
    handleCancelBooking,
    isServiceBooked,
    getServiceBooking,
    editingBooking,
    handleStartEditBooking,
  };
}
