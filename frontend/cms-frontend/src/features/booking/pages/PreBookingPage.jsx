import React, { useState, useEffect } from "react";
import CanteenDateSelector from "../components/CanteenDateSelector";
import PreBookItemCard from "../components/PreBookItemCard";
import CartSummaryPanel from "../components/CartSummaryPanel";
import { usePublishedMenu } from "../hooks/usePublishedMenu";
import { useBookingCart } from "../hooks/useBookingCart";
import { createBooking } from "../api/bookingApi";
import { useAuth } from "../../../hooks/useAuth";

export default function PreBookingPage() {
  const { menuItems, loading, error, fetchPublishedMenus } = usePublishedMenu();
  const { cart, addToCart, removeFromCart, clearCart, totalAmount, totalItemsCount } = useBookingCart();
  
  const [currentContext, setCurrentContext] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { customer } = useAuth();

  const handleContextChange = (context) => {
    setCurrentContext(context);
    clearCart();
    setSuccessMessage("");
    setSubmitError("");
    fetchPublishedMenus(context.canteenId, context.serviceDate);
  };

  const handleConfirmBooking = async () => {
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
        QTY: item.qty
      });
      return acc;
    }, {});

    try {
      // Create a booking for each distinct SERVICEID
      const promises = Object.entries(bookingsByService).map(([serviceId, items]) => {
        const payload = {
          PBOOKTYPECODE: "PB",
          PCUSTOMERID: customer.CUSTOMERID,
          PSERVICEID: parseInt(serviceId, 10),
          PSERVICEDATE: currentContext.serviceDate,
          PITEMSJSON: items
        };
        return createBooking(payload);
      });

      await Promise.all(promises);
      
      setSuccessMessage("Your booking was placed successfully!");
      clearCart();
      // Optionally re-fetch menu to update AVAILQTY limits
      fetchPublishedMenus(currentContext.canteenId, currentContext.serviceDate);
      
    } catch (err) {
      console.error("Booking error:", err);
      setSubmitError(err?.response?.data?.MESSAGE || "Failed to place booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Pre-Book Meals</h1>
        <p className="text-slate-500">Plan ahead and reserve your meals to avoid the rush.</p>
      </div>

      <CanteenDateSelector onContextChange={handleContextChange} />

      {/* Main Grid: Menu vs Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Menu Grid */}
        <div className="lg:col-span-8 xl:col-span-9">
          {successMessage && (
            <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-medium">
              {successMessage}
            </div>
          )}
          
          {submitError && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-medium">
              {submitError}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-50 rounded-xl text-red-600 font-medium border border-red-100">
              {error}
            </div>
          ) : Object.keys(menuItems).length === 0 && currentContext ? (
            <div className="text-center py-20 bg-slate-50 rounded-xl text-slate-500 border border-slate-200">
              No published menus found for the selected canteen and date.
            </div>
          ) : (
            Object.entries(menuItems).map(([key, group]) => (
              <div key={key} className="mb-10 last:mb-0">
                <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-orange-500 inline-block">
                  {group.SERVNAME}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {group.items.filter(i => i.ISPREBOOK === 1).map((item) => (
                    <PreBookItemCard
                      key={item.DAYMENUID}
                      item={item}
                      cartItem={cart[item.DAYMENUID]}
                      onAdd={addToCart}
                      onRemove={removeFromCart}
                    />
                  ))}
                  {group.items.filter(i => i.ISPREBOOK === 1).length === 0 && (
                     <div className="col-span-full py-4 text-slate-500 italic">No items available for pre-booking in this service.</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Side: Sticky Cart Summary */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6">
          <CartSummaryPanel
            cart={cart}
            totalAmount={totalAmount}
            totalItems={totalItemsCount}
            onConfirm={handleConfirmBooking}
            isSubmitting={isSubmitting}
          />
        </div>

      </div>
    </div>
  );
}
