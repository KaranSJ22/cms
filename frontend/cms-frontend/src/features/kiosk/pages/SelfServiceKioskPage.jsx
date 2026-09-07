import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { kioskApi } from "../api/kioskApi";
import { formatINR } from "../../../utils/formatters";
import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  WalletIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

export default function SelfServiceKioskPage() {
  const { sessionActive, startSession, endSession, exitTrigger, resetWatchdog } =
    useOutletContext() || {};

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

  // ------------------------------------------------------------
  // 1. Idle Screen (Waiting for card scan)
  // ------------------------------------------------------------
  if (!sessionActive || !employeeData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        {/* Hardware Reader Pulse Wave */}
        <div className="relative mb-8">
          <div className="w-36 h-36 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg
                className="w-12 h-12 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white font-grotesk tracking-tight mb-3">
          Tap Your ISRO Smart Card
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-lg mb-8">
          Place your RFID badge on the scanner below to reserve meals, view active
          orders, or check balance.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-600 text-rose-200 font-bold text-lg max-w-md animate-in fade-in">
            <p>{typeof error === "object" ? error.message : error}</p>
            {typeof error === "object" && error.correlationId && (
              <p className="text-xs font-mono text-rose-400 mt-1.5 font-normal tracking-wide">
                Ref ID: {error.correlationId}
              </p>
            )}
          </div>
        )}

        {/* Hardware Keyboard Wedge Input */}
        <form onSubmit={handleScan} className="w-full max-w-md">
          <input
            ref={inputRef}
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
            placeholder="TAP RFID / ENTER LOGIN ID"
            className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-4 text-2xl font-mono text-center uppercase tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
            autoComplete="off"
            autoFocus
          />
          <button type="submit" className="hidden" />
        </form>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 2. Active Session View
  // ------------------------------------------------------------
  const { customer, wallet, upcomingBookings = [] } = employeeData;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* ── Employee Profile Welcome Header ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Active Session
            </span>
            <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-slate-800 text-slate-300 font-mono">
              {customer.customerTypeCode === "PRM"
                ? "Permanent Staff"
                : customer.customerTypeCode === "CNT" ||
                  customer.customerTypeCode === "CONTEMP"
                ? "Contract Staff"
                : customer.customerTypeCode === "VIS" ||
                  customer.customerTypeCode === "VISITOR"
                ? "Visitor"
                : "Employee"}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white font-grotesk mt-1">
            {customer.displayName || "Employee"}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            ID: {customer.loginId || customer.customerId}
          </p>
        </div>

        {/* Financial Billing Badge */}
        <div>
          {customer.isWalletEligible && wallet ? (
            <div className="bg-emerald-950/60 border border-emerald-800/80 px-5 py-3 rounded-2xl text-right">
              <span className="text-[0.68rem] uppercase font-bold text-emerald-400 block">
                Prepaid Wallet Balance
              </span>
              <p className="text-2xl md:text-3xl font-black text-white font-mono">
                {formatINR(wallet.balance)}
              </p>
              {wallet.reserved > 0 && (
                <span className="text-[0.65rem] text-slate-400">
                  (Hold: {formatINR(wallet.reserved)})
                </span>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 px-5 py-3 rounded-2xl text-right">
              <span className="text-[0.68rem] uppercase font-bold text-slate-400 block">
                Billing Model
              </span>
              <p className="text-sm md:text-base font-bold text-slate-200">
                Monthly Payroll Subsidized
              </p>
              <span className="text-[0.65rem] text-emerald-400">
                ✓ No Advance Wallet Required
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Feedback Message ── */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border-2 border-emerald-600 text-emerald-200 rounded-2xl text-center font-bold animate-in fade-in flex items-center justify-center gap-2">
          <CheckCircleIcon className="w-6 h-6 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Mode Selection Touch Tabs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            resetWatchdog?.();
            setActiveTab("bookings");
          }}
          className={`p-4 rounded-2xl border font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2.5 ${
            activeTab === "bookings"
              ? "bg-slate-100 text-slate-950 border-white shadow-lg"
              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
          }`}
        >
          <ClipboardDocumentListIcon className="w-5 h-5 shrink-0" />
          <span>Active Bookings ({upcomingBookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            resetWatchdog?.();
            setActiveTab("book_next_day");
          }}
          className={`p-4 rounded-2xl border font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2.5 ${
            activeTab === "book_next_day"
              ? "bg-orange-500 text-slate-950 border-orange-400 shadow-lg shadow-orange-500/20"
              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
          }`}
        >
          <CalendarDaysIcon className="w-5 h-5 shrink-0" />
          <span>Book Tomorrow's Meal</span>
        </button>

        {customer.isWalletEligible && (
          <button
            type="button"
            onClick={() => {
              resetWatchdog?.();
              setActiveTab("wallet");
            }}
            className={`p-4 rounded-2xl border font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2.5 col-span-2 md:col-span-1 ${
              activeTab === "wallet"
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
            }`}
          >
            <WalletIcon className="w-5 h-5 shrink-0" />
            <span>Wallet Account</span>
          </button>
        )}
      </div>

      {/* ── Tab 1: Active Bookings (View & Cancel) ── */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Your Upcoming Meals
            </h3>
            <span className="text-xs text-slate-500">
              Only pending meals can be cancelled before preparation deadline
            </span>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-xl font-bold text-slate-300">
                No active meal reservations found.
              </p>
              <p className="text-sm text-slate-500">
                You do not have any meals pending for today or tomorrow.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("book_next_day")}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-400 text-slate-950 transition-colors"
              >
                + Book Tomorrow's Meal Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingBookings.map((b) => (
                <div
                  key={b.BOOKID}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-orange-400 font-mono">
                        {b.BOOKNO}
                      </span>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        {b.SERVNAME || `Service #${b.SERVICEID}`}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Date:{" "}
                        <span className="text-slate-200 font-semibold">
                          {b.SERVICEDATE?.slice(0, 10)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {b.STATUSCODE || "CRT"}
                      </span>
                      <p className="text-sm font-black text-white font-mono mt-1">
                        {formatINR(b.TOTALAMOUNT)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-mono">
                      Items: {b.TOTALITEMS || b.TOTALQTY || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(b.BOOKID)}
                      disabled={cancellingId === b.BOOKID}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      <span>
                        {cancellingId === b.BOOKID
                          ? "Cancelling..."
                          : "Cancel Booking"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Book Next Day Meal ── */}
      {activeTab === "book_next_day" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="text-base font-bold text-white font-grotesk">
                Tomorrow's Canteen Menu ({nextDayMenu?.targetDate})
              </h3>
              <p className="text-xs text-slate-400">
                Self-service kiosk pre-booking is open for tomorrow. Select meal
                portions and confirm.
              </p>
            </div>
            <button
              type="button"
              onClick={loadNextDayMenu}
              disabled={menuLoading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowPathIcon
                className={`w-5 h-5 ${menuLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {menuLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading tomorrow's published menus...
            </div>
          ) : !nextDayMenu || nextDayMenu.services?.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <p className="text-lg font-bold text-slate-300">
                No menu published for tomorrow yet.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Please check back later once the canteen manager publishes tomorrow's
                schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {nextDayMenu.services.map((service) => {
                const serviceItemsSelected = service.items.filter(
                  (i) => (selectedItems[i.dayMenuId] || 0) > 0
                );
                const totalServiceAmt = serviceItemsSelected.reduce(
                  (sum, i) => sum + i.rate * (selectedItems[i.dayMenuId] || 0),
                  0
                );

                return (
                  <div
                    key={service.serviceId}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5"
                  >
                    {/* Service Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="text-xl font-bold text-white font-grotesk">
                          {service.serviceName}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          Service window: {service.startTime?.slice(0, 5)} -{" "}
                          {service.endTime?.slice(0, 5)}
                        </span>
                      </div>
                      {serviceItemsSelected.length > 0 && (
                        <div className="text-right">
                          <span className="text-xs text-orange-400 font-bold block">
                            Subtotal: {formatINR(totalServiceAmt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dish Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {service.items.map((item) => {
                        const qty = selectedItems[item.dayMenuId] || 0;
                        return (
                          <div
                            key={item.dayMenuId}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                              qty > 0
                                ? "bg-slate-800/80 border-orange-500/60"
                                : "bg-slate-950 border-slate-800"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-1">
                                <span className="text-[0.65rem] font-bold uppercase text-orange-400 font-mono">
                                  {item.isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                                </span>
                                <span className="text-base font-black text-white font-mono">
                                  {formatINR(item.rate)}
                                </span>
                              </div>
                              <h5 className="text-base font-bold text-white mt-1">
                                {item.itemName}
                              </h5>
                              {item.itemDesc && (
                                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                                  {item.itemDesc}
                                </p>
                              )}
                            </div>

                            {/* Touch Quantity Stepper */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                              <span className="text-xs text-slate-400">Qty:</span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item, -1)}
                                  disabled={qty === 0}
                                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center text-white"
                                >
                                  <MinusIcon className="w-4 h-4" />
                                </button>
                                <span className="w-6 text-center text-lg font-black text-white font-mono">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item, 1)}
                                  className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 flex items-center justify-center font-bold"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Confirm Booking Bar for this Service */}
                    {serviceItemsSelected.length > 0 && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleConfirmBooking(service)}
                          disabled={bookingLoading}
                          className="px-8 py-3.5 rounded-2xl font-black text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          {bookingLoading
                            ? "Confirming..."
                            : `CONFIRM ${service.serviceName.toUpperCase()} (${formatINR(
                                totalServiceAmt
                              )})`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Wallet (Contract Workers & Visitors ONLY) ── */}
      {activeTab === "wallet" && customer.isWalletEligible && wallet && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 max-w-xl mx-auto w-full text-center">
          <WalletIcon className="w-16 h-16 text-emerald-400 mx-auto" />
          <div>
            <span className="text-xs font-bold uppercase text-emerald-400 font-mono">
              Prepaid Ledger Balance
            </span>
            <h3 className="text-5xl font-black text-white font-mono mt-1 tracking-tight">
              {formatINR(wallet.balance)}
            </h3>
            {wallet.reserved > 0 && (
              <p className="text-sm text-slate-400 mt-2 font-mono">
                Active Meal Holds:{" "}
                <span className="text-amber-400 font-bold">
                  {formatINR(wallet.reserved)}
                </span>
              </p>
            )}
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-2">
            <p className="font-bold text-slate-200">Wallet Usage Notes:</p>
            <p>
              • Funds are reserved automatically when advance meals are booked.
            </p>
            <p>
              • Cancelling a meal before cutoff releases funds back to your balance
              immediately.
            </p>
            <p>
              • For cash top-up or refund requests, visit the Canteen Manager office.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
