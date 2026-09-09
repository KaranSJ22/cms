import { useState, useEffect, useCallback } from "react";
import CanteenDateSelector from "../components/CanteenDateSelector";
import PreBookItemCard from "../components/PreBookItemCard";
import CartSummaryPanel from "../components/CartSummaryPanel";
import WeeklyMealPlanner from "../components/WeeklyMealPlanner";
import { usePublishedMenu } from "../hooks/usePublishedMenu";
import { useBookingCart } from "../hooks/useBookingCart";
import {
  createBooking,
  getActiveBooking,
  addBookingItem,
  updateBookingItemQty,
  cancelBookingItem,
  cancelBooking,
} from "../api/bookingApi";
import { useAuth } from "../../../hooks/useAuth";
import {
  PencilSquareIcon,
  LockClosedIcon,
  XCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

export default function PreBookingPage() {
  const [plannerMode, setPlannerMode] = useState("WEEKLY"); // "WEEKLY" | "DAILY"
  const { menuItems, loading, error, fetchPublishedMenus } = usePublishedMenu();
  const { cart, addToCart, removeFromCart, clearCart, totalAmount, totalItemsCount } = useBookingCart();

  const [currentContext, setCurrentContext] = useState(null);
  const [activeBookings, setActiveBookings] = useState({});
  const [activeBookingsLoading, setActiveBookingsLoading] = useState(false);
  const [itemActionLoading, setItemActionLoading] = useState({});
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { customer } = useAuth();

  // Load active bookings for all services in the current context
  const loadActiveBookings = useCallback(
    async (canteenId, serviceDate, menuData = {}) => {
      if (!canteenId || !serviceDate || !customer?.CUSTOMERID) return;

      const serviceIds = Object.values(menuData).map((g) => g.SERVICEID);

      const bookingsMap = {};
      const now = new Date();

      try {
        await Promise.all(
          serviceIds.map(async (serviceId) => {
            try {
              const res = await getActiveBooking({
                canteenId,
                serviceId,
                serviceDate,
                customerId: customer.CUSTOMERID,
              });

              if (res && res.HEADER) {
                // Check cutoff
                const cutoffStr = res.HEADER.MIN_BOOKUNTIL || res.ITEMS?.[0]?.BOOKUNTIL;
                const isReadOnly = cutoffStr ? now > new Date(cutoffStr) : false;

                bookingsMap[serviceId] = {
                  ...res,
                  isReadOnly,
                };
              }
            } catch (err) {
              console.warn(`Could not check active booking for service ${serviceId}`, err);
            }
          })
        );

        setActiveBookings(bookingsMap);
      } catch (err) {
        console.error("Failed to load active bookings", err);
      } finally {
        setActiveBookingsLoading(false);
      }
    },
    [customer]
  );

  const handleContextChange = async (context) => {
    setCurrentContext(context);
    clearCart();
    setSuccessMessage("");
    setSubmitError("");
    setActiveBookings({});

    // Fetch published menus and then load active bookings
    try {
      await fetchPublishedMenus(context.canteenId, context.serviceDate);
    } catch (err) {
      console.error("Context change error:", err);
    }
  };

  // Re-run active bookings check whenever menuItems changes
  useEffect(() => {
    if (currentContext?.canteenId && currentContext?.serviceDate && Object.keys(menuItems).length > 0) {
      loadActiveBookings(currentContext.canteenId, currentContext.serviceDate, menuItems);
    }
  }, [currentContext, menuItems, loadActiveBookings]);

  // ---------------------------------------------------------------------------
  // INCREMENTAL EDIT FLOW HANDLERS (for services with active bookings)
  // ---------------------------------------------------------------------------

  const handleIncrementalAdd = async (serviceId, item) => {
    const booking = activeBookings[serviceId];
    if (!booking) return;

    const bookingId = booking.HEADER.BOOKID;
    const activeItem = (booking.ITEMS || []).find(
      (bi) => bi.DAYMENUID === item.DAYMENUID && (bi.STATUSCODE === "CRT" || bi.STATUSID === 30)
    );

    setItemActionLoading((prev) => ({ ...prev, [item.DAYMENUID]: true }));
    setSubmitError("");
    setSuccessMessage("");

    try {
      if (activeItem) {
        // Increment quantity
        const newQty = activeItem.QTY + 1;
        await updateBookingItemQty(bookingId, activeItem.BOOKITEMID, { QTY: newQty });
        setSuccessMessage(`Updated quantity for ${item.ITEMNAME} (Qty: ${newQty})`);
      } else {
        // Add new item
        await addBookingItem(bookingId, {
          DAYMENUID: item.DAYMENUID,
          QTY: 1,
        });
        setSuccessMessage(`Added ${item.ITEMNAME} to Booking #${booking.HEADER.BOOKNO}`);
      }

      // Refresh active bookings for this context
      await loadActiveBookings(currentContext.canteenId, currentContext.serviceDate, menuItems);
    } catch (err) {
      console.error("Incremental add error:", err);
      setSubmitError(err?.response?.data?.MESSAGE || "Failed to update booking item.");
    } finally {
      setItemActionLoading((prev) => ({ ...prev, [item.DAYMENUID]: false }));
    }
  };

  const handleIncrementalRemove = async (serviceId, item) => {
    const booking = activeBookings[serviceId];
    if (!booking) return;

    const bookingId = booking.HEADER.BOOKID;
    const activeItem = (booking.ITEMS || []).find(
      (bi) => bi.DAYMENUID === item.DAYMENUID && (bi.STATUSCODE === "CRT" || bi.STATUSID === 30)
    );

    if (!activeItem) return;

    setItemActionLoading((prev) => ({ ...prev, [item.DAYMENUID]: true }));
    setSubmitError("");
    setSuccessMessage("");

    try {
      if (activeItem.QTY > 1) {
        // Decrease quantity
        const newQty = activeItem.QTY - 1;
        await updateBookingItemQty(bookingId, activeItem.BOOKITEMID, { QTY: newQty });
        setSuccessMessage(`Updated quantity for ${item.ITEMNAME} (Qty: ${newQty})`);
      } else {
        // Remove / Soft-cancel item
        await cancelBookingItem(bookingId, activeItem.BOOKITEMID, {
          PCANCELREASON: "Removed by customer in edit mode",
        });
        setSuccessMessage(`Removed ${item.ITEMNAME} from Booking #${booking.HEADER.BOOKNO}`);
      }

      // Refresh active bookings for this context
      await loadActiveBookings(currentContext.canteenId, currentContext.serviceDate, menuItems);
    } catch (err) {
      console.error("Incremental remove error:", err);
      setSubmitError(err?.response?.data?.MESSAGE || "Failed to modify booking item.");
    } finally {
      setItemActionLoading((prev) => ({ ...prev, [item.DAYMENUID]: false }));
    }
  };

  const handleCancelWholeBooking = async (serviceId) => {
    const booking = activeBookings[serviceId];
    if (!booking) return;

    const confirmMsg = `Are you sure you want to cancel the entire Booking #${booking.HEADER.BOOKNO} for ${booking.HEADER.SERVNAME}?`;
    if (!window.confirm(confirmMsg)) return;

    setCancellingBookingId(booking.HEADER.BOOKID);
    setSubmitError("");
    setSuccessMessage("");

    try {
      await cancelBooking(booking.HEADER.BOOKID, {
        PCANCELREASON: "Cancelled by customer via edit view",
      });
      setSuccessMessage(`Booking #${booking.HEADER.BOOKNO} was cancelled successfully.`);
      await loadActiveBookings(currentContext.canteenId, currentContext.serviceDate, menuItems);
    } catch (err) {
      console.error("Cancel booking error:", err);
      setSubmitError(err?.response?.data?.MESSAGE || "Failed to cancel booking. The cutoff window may have passed.");
    } finally {
      setCancellingBookingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // NEW BOOKING CONFIRMATION HANDLER (for services without active bookings)
  // ---------------------------------------------------------------------------

  const handleConfirmNewBooking = async () => {
    if (totalItemsCount === 0 || !currentContext) return;
    if (!customer?.CUSTOMERID) {
      setSubmitError("Customer profile not found. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    // Group items in cart by SERVICEID
    const bookingsByService = Object.values(cart).reduce((acc, item) => {
      if (!acc[item.SERVICEID]) acc[item.SERVICEID] = [];
      acc[item.SERVICEID].push({
        DAYMENUID: item.DAYMENUID,
        QTY: item.qty,
      });
      return acc;
    }, {});

    try {
      const promises = Object.entries(bookingsByService).map(([serviceId, items]) => {
        const payload = {
          PBOOKTYPECODE: "PB",
          PCUSTOMERID: customer.CUSTOMERID,
          PSERVICEID: parseInt(serviceId, 10),
          PSERVICEDATE: currentContext.serviceDate,
          PITEMSJSON: items,
        };
        return createBooking(payload);
      });

      await Promise.all(promises);

      setSuccessMessage("Your booking was placed successfully!");
      clearCart();
      await fetchPublishedMenus(currentContext.canteenId, currentContext.serviceDate);
      await loadActiveBookings(currentContext.canteenId, currentContext.serviceDate, menuItems);
    } catch (err) {
      console.error("Booking error:", err);
      setSubmitError(err?.response?.data?.MESSAGE || "Failed to place booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1550px] mx-auto pb-10 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Pre-Book Meals</h1>
        <p className="text-slate-500">Plan ahead, reserve weekly passes, or update reservations to avoid the rush.</p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit mb-6 shadow-xs border border-slate-200">
        <button
          type="button"
          onClick={() => setPlannerMode("WEEKLY")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            plannerMode === "WEEKLY"
              ? "bg-[#0F172A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <SparklesIcon className="w-4 h-4 text-orange-400" />
          <span>5-Day Weekly Pass</span>
          <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-extrabold rounded-md uppercase">
            Recommended
          </span>
        </button>
        <button
          type="button"
          onClick={() => setPlannerMode("DAILY")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            plannerMode === "DAILY"
              ? "bg-[#0F172A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarDaysIcon className="w-4 h-4" />
          <span>Single Day Booking</span>
        </button>
      </div>

      {plannerMode === "WEEKLY" ? (
        <WeeklyMealPlanner />
      ) : (
        <>
          <CanteenDateSelector onContextChange={handleContextChange} />

      {/* Main Grid: Menu vs Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Menu Grid */}
        <div className="lg:col-span-8 xl:col-span-9">
          {successMessage && (
            <div className="mb-6 bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 font-medium flex items-center gap-2 shadow-sm animate-in fade-in">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {submitError && (
            <div className="mb-6 bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 font-medium flex items-center gap-2 shadow-sm animate-in fade-in">
              <XCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {loading || activeBookingsLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-rose-50 rounded-xl text-rose-600 font-medium border border-rose-100">
              {error}
            </div>
          ) : Object.keys(menuItems).length === 0 && currentContext ? (
            <div className="text-center py-20 bg-slate-50 rounded-xl text-slate-500 border border-slate-200">
              No published menus found for the selected canteen and date.
            </div>
          ) : (
            Object.entries(menuItems).map(([key, group]) => {
              const activeBooking = activeBookings[group.SERVICEID];
              const hasActiveBooking = Boolean(activeBooking);
              const isReadOnly = activeBooking?.isReadOnly;

              // Map active items for fast lookup: { [dayMenuId]: item }
              const activeItemsMap = {};
              if (hasActiveBooking) {
                (activeBooking.ITEMS || [])
                  .filter((i) => i.STATUSCODE === "CRT" || i.STATUSID === 30)
                  .forEach((i) => {
                    activeItemsMap[i.DAYMENUID] = i;
                  });
              }

              return (
                <div key={key} className="mb-10 last:mb-0 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  {/* Service Header with Context Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span>{group.SERVNAME}</span>
                      </h2>
                    </div>

                    {/* Mode Status Banner / Badges */}
                    {hasActiveBooking ? (
                      isReadOnly ? (
                        <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
                          <LockClosedIcon className="w-4 h-4 text-slate-500" />
                          <span>Booking #{activeBooking.HEADER.BOOKNO} (Locked - Cutoff passed)</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 bg-amber-50 text-amber-900 px-3.5 py-1.5 rounded-xl border border-amber-200 text-xs font-bold shadow-xs">
                            <PencilSquareIcon className="w-4 h-4 text-amber-600" />
                            <span>Editing Active Booking #{activeBooking.HEADER.BOOKNO}</span>
                          </div>
                          <button
                            onClick={() => handleCancelWholeBooking(group.SERVICEID)}
                            disabled={cancellingBookingId === activeBooking.HEADER.BOOKID}
                            className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                          >
                            {cancellingBookingId === activeBooking.HEADER.BOOKID ? "Cancelling..." : "Cancel Booking"}
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                        New Booking Flow
                      </span>
                    )}
                  </div>

                  {/* Pre-Booking Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {group.items
                      .filter((i) => i.ISPREBOOK === 1)
                      .map((item) => {
                        if (hasActiveBooking) {
                          // In Active Booking Mode (Edit or ReadOnly)
                          const bookedItem = activeItemsMap[item.DAYMENUID];
                          const cartItemRepresentation = bookedItem
                            ? { qty: bookedItem.QTY }
                            : null;

                          return (
                            <PreBookItemCard
                              key={item.DAYMENUID}
                              item={item}
                              cartItem={cartItemRepresentation}
                              onAdd={() => handleIncrementalAdd(group.SERVICEID, item)}
                              onRemove={() => handleIncrementalRemove(group.SERVICEID, item)}
                              isEditMode={!isReadOnly}
                              isReadOnly={isReadOnly}
                              isLoading={itemActionLoading[item.DAYMENUID] || false}
                            />
                          );
                        } else {
                          // Standard Draft Cart Mode
                          return (
                            <PreBookItemCard
                              key={item.DAYMENUID}
                              item={item}
                              cartItem={cart[item.DAYMENUID]}
                              onAdd={addToCart}
                              onRemove={removeFromCart}
                              isEditMode={false}
                              isReadOnly={false}
                            />
                          );
                        }
                      })}

                    {group.items.filter((i) => i.ISPREBOOK === 1).length === 0 && (
                      <div className="col-span-full py-4 text-slate-500 italic">
                        No items available for pre-booking in this service.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Sticky Cart Summary Panel */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6">
          <CartSummaryPanel
            cart={cart}
            totalAmount={totalAmount}
            totalItems={totalItemsCount}
            activeBookings={activeBookings}
            onConfirm={handleConfirmNewBooking}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
        </>
      )}
    </div>
  );
}
