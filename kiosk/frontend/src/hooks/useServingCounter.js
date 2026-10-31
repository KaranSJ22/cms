import { useState, useEffect, useRef, useCallback } from "react";
import { kioskApi } from "../api/kioskApi";

const SESSION_STORAGE_KEY = "cms_kiosk_counter_session";

export const useServingCounter = () => {
  // 1. Staff Authentication & Shift State
  const [staffSession, setStaffSession] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [selectedCanteen, setSelectedCanteen] = useState(() => {
    if (staffSession?.user?.canteenRoles?.length === 1) {
      const cr = staffSession.user.canteenRoles[0];
      return { canteenId: cr.canteenId, canteenName: cr.canteenName, canteenCode: cr.canteenCode };
    }
    return null;
  });

  const [canteensList, setCanteensList] = useState([]);
  const [todaySlots, setTodaySlots] = useState([]);
  const [activeSlot, setActiveSlot] = useState(null);

  // 2. Scan & Active Order State
  const [identifier, setIdentifier] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // 3. Serve & Action State
  const [serveLoading, setServeLoading] = useState(false);
  const [serveSuccess, setServeSuccess] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [onSpotModalOpen, setOnSpotModalOpen] = useState(false);

  // Ref to always auto-focus scan input
  const scanInputRef = useRef(null);
  const autoResetTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  // Re-focus scan input
  const focusScanner = useCallback(() => {
    setTimeout(() => {
      scanInputRef.current?.focus();
    }, 100);
  }, []);

  // Persist session to localStorage
  useEffect(() => {
    if (staffSession) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(staffSession));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [staffSession]);

  // Load canteens list on mount
  useEffect(() => {
    kioskApi
      .counterGetCanteens()
      .then((res) => {
        const list = res.data?.DATA || res.data || [];
        setCanteensList(list);
      })
      .catch(() => {});
  }, []);

  // Load today's slots when selected canteen changes
  useEffect(() => {
    if (!selectedCanteen?.canteenId) return;

    kioskApi
      .counterGetTodaySlots({ canteenId: selectedCanteen.canteenId })
      .then((res) => {
        const slots = res.data?.DATA || res.data || [];
        setTodaySlots(slots);
        const current = slots.find((s) => s.ISCURRENT === 1) || slots[0] || null;
        setActiveSlot(current);
      })
      .catch(() => {});
  }, [selectedCanteen]);

  // Handle staff login (supports { loginId, password } or { rfidUid } or positional arguments)
  const handleLogin = async (loginId, password, rfidUid) => {
    setOrderError(null);
    try {
      const payload =
        typeof loginId === "object" && loginId !== null
          ? loginId
          : { loginId, password, rfidUid };
      const res = await kioskApi.counterLogin(payload);
      const data = res.data?.DATA || res.data;
      setStaffSession(data);

      const roles = data?.user?.canteenRoles || [];
      if (roles.length === 1) {
        setSelectedCanteen({
          canteenId: roles[0].canteenId,
          canteenName: roles[0].canteenName,
          canteenCode: roles[0].canteenCode,
        });
      }
      return data;
    } catch (err) {
      const msg = err.response?.data?.MESSAGE || err.message || "Invalid credentials or unauthorized role";
      setOrderError(msg);
      throw new Error(msg);
    }
  };

  // Handle staff logout / shift end
  const handleLogout = () => {
    setStaffSession(null);
    setSelectedCanteen(null);
    setOrderData(null);
    setOrderError(null);
    setServeSuccess(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  // Handle manual or RFID card scan
  const handleScan = async (scannedId = identifier) => {
    const cleanId = (scannedId || "").trim();
    if (!cleanId) return;

    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setOrderLoading(true);
    setOrderError(null);
    setOrderData(null);
    setServeSuccess(null);

    try {
      const res = await kioskApi.counterResolve(cleanId, {
        canteenId: selectedCanteen?.canteenId || 1,
        daySlotId: activeSlot?.DAYSLOTID || null,
      });

      const data = res.data?.DATA || res.data;
      setOrderData(data);
      setIdentifier("");
    } catch (err) {
      const msg = err.response?.data?.MESSAGE || err.message || "No booking found for this badge or code today";
      setOrderError(msg);
      setIdentifier("");
      focusScanner();

      // Auto-dismiss error badge after 4 seconds
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setOrderError(null);
      }, 4000);
    } finally {
      setOrderLoading(false);
    }
  };

  // Handle Serve (1-Tap Fast Dispense)
  const handleServe = async () => {
    if (!orderData?.HEADER?.BOOKID) return;

    setServeLoading(true);
    setOrderError(null);

    try {
      const bookingId = orderData.HEADER.BOOKID;
      await kioskApi.counterServe({ bookingId }, staffSession?.token);

      const bookNo = orderData.HEADER.BOOKNO;
      const customerName = orderData.HEADER.CUSTOMERNAME;

      setServeSuccess({
        bookNo,
        customerName,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });

      // Clear order data
      setOrderData(null);

      // Fast auto-reset after 1.5 seconds so the line moves rapidly
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = setTimeout(() => {
        setServeSuccess(null);
        focusScanner();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.MESSAGE || err.message || "Failed to mark order as served";
      setOrderError(msg);
    } finally {
      setServeLoading(false);
    }
  };

  // Handle Counter Cancellation
  const handleCancel = async (reason = "Cancelled at counter upon customer request") => {
    if (!orderData?.HEADER?.BOOKID) return;

    setCancelLoading(true);
    setOrderError(null);

    try {
      const bookingId = orderData.HEADER.BOOKID;
      const res = await kioskApi.counterCancel({ bookingId, cancelReason: reason }, staffSession?.token);

      setOrderData(null);
      setCancelModalOpen(false);
      setServeSuccess({
        bookNo: orderData.HEADER.BOOKNO,
        customerName: orderData.HEADER.CUSTOMERNAME,
        isCancelled: true,
        message: res.data?.MESSAGE || "Order cancelled & wallet refunded",
      });

      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = setTimeout(() => {
        setServeSuccess(null);
        focusScanner();
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.MESSAGE || err.message || "Failed to cancel booking";
      setOrderError(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  // Clear current order card back to scan hero
  const handleClearOrder = () => {
    setOrderData(null);
    setOrderError(null);
    setServeSuccess(null);
    setIdentifier("");
    focusScanner();
  };

  return {
    staffSession,
    selectedCanteen,
    setSelectedCanteen,
    canteensList,
    todaySlots,
    activeSlot,
    setActiveSlot,
    identifier,
    setIdentifier,
    orderLoading,
    orderError,
    setOrderError,
    orderData,
    serveLoading,
    serveSuccess,
    setServeSuccess,
    cancelLoading,
    cancelModalOpen,
    setCancelModalOpen,
    onSpotModalOpen,
    setOnSpotModalOpen,
    scanInputRef,
    focusScanner,
    handleLogin,
    handleLogout,
    handleScan,
    handleServe,
    handleCancel,
    handleClearOrder,
  };
};
