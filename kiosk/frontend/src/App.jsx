import React, { useState } from "react";
import { useSelfServiceKiosk } from "./hooks/useSelfServiceKiosk";
import { useServingCounter } from "./hooks/useServingCounter";
import { useDragScroll } from "./hooks/useDragScroll";

// Self-Service Components
import KioskScanHero from "./components/KioskScanHero";
import TodayBookingsTab from "./components/TodayBookingsTab";
import NextDayExpressTab from "./components/NextDayExpressTab";
import MiniWalletTab from "./components/MiniWalletTab";
import ConfirmationModal from "./components/ConfirmationModal";

// Staff Serving Counter Components
import CounterShiftLogin from "./components/counter/CounterShiftLogin";
import CounterTopBar from "./components/counter/CounterTopBar";
import CounterScanHero from "./components/counter/CounterScanHero";
import ActiveOrderCard from "./components/counter/ActiveOrderCard";
import OnSpotModal from "./components/counter/OnSpotModal";

export default function App() {
  useDragScroll();

  // Mode: 'SELF_SERVICE' (Default Employee Booking) vs 'STAFF_COUNTER' (Serving Terminal)
  const [terminalMode, setTerminalMode] = useState("SELF_SERVICE");

  // 1. Self-Service Hook
  const selfService = useSelfServiceKiosk();

  // 2. Staff Serving Counter Hook
  const counter = useServingCounter();

  // ------------------------------------------------------------
  // MODE 1: STAFF SERVING COUNTER
  // ------------------------------------------------------------
  if (terminalMode === "STAFF_COUNTER") {
    // If not logged in or no canteen chosen, show Shift Login / Canteen Picker
    if (!counter.staffSession || !counter.selectedCanteen) {
      return (
        <CounterShiftLogin
          staffSession={counter.staffSession}
          selectedCanteen={counter.selectedCanteen}
          onSelectCanteen={counter.setSelectedCanteen}
          onLogin={counter.handleLogin}
          canteensList={counter.canteensList}
          onExitMode={() => setTerminalMode("SELF_SERVICE")}
        />
      );
    }

    // Active Serving Counter Interface
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between select-none">
        {/* Counter Top Bar */}
        <CounterTopBar
          staffSession={counter.staffSession}
          selectedCanteen={counter.selectedCanteen}
          activeSlot={counter.activeSlot}
          todaySlots={counter.todaySlots}
          onSelectSlot={counter.setActiveSlot}
          onOpenOnSpot={() => counter.setOnSpotModalOpen(true)}
          onSwitchCanteen={() => counter.setSelectedCanteen(null)}
          onLogout={() => {
            counter.handleLogout();
            setTerminalMode("SELF_SERVICE");
          }}
        />

        {/* Success Flash Banner (1.5s Auto-Dismiss) */}
        {counter.serveSuccess && (
          <div className="p-4 mx-6 mt-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300 flex items-center justify-between shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✓</span>
              <div>
                <h4 className="text-lg font-black tracking-wide text-white">
                  {counter.serveSuccess.isCancelled ? "BOOKING CANCELLED" : "ORDER SERVED SUCCESSFULLY"}
                </h4>
                <p className="text-xs text-emerald-300/90 font-mono">
                  {counter.serveSuccess.customerName} • Ref: #{counter.serveSuccess.bookNo} • {counter.serveSuccess.time || "Dispensed"}
                </p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/30 font-bold uppercase tracking-wider">
              {counter.serveSuccess.isCancelled ? "Refund Processed" : "Ready for next"}
            </span>
          </div>
        )}

        {/* Main Canvas: Order Card OR Scan Hero */}
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {counter.orderData ? (
            <ActiveOrderCard
              orderData={counter.orderData}
              onServe={counter.handleServe}
              serveLoading={counter.serveLoading}
              onCancelClick={() => counter.setCancelModalOpen(true)}
              onClear={counter.handleClearOrder}
            />
          ) : (
            <CounterScanHero
              inputRef={counter.scanInputRef}
              identifier={counter.identifier}
              setIdentifier={counter.setIdentifier}
              onScan={counter.handleScan}
              loading={counter.orderLoading}
              error={counter.orderError}
              disabled={Boolean(counter.onSpotModalOpen || counter.cancelModalOpen)}
              onDismissError={() => counter.setOrderError(null)}
            />
          )}
        </main>

        {/* On-Spot Surplus Food (Walk-In) Modal */}
        <OnSpotModal
          isOpen={counter.onSpotModalOpen}
          onClose={() => counter.setOnSpotModalOpen(false)}
          canteenId={counter.selectedCanteen?.canteenId}
          serviceId={counter.activeSlot?.SERVICEID}
          staffToken={counter.staffSession?.token}
          onSuccess={(res) => {
            counter.setServeSuccess({
              bookNo: res.bookNo,
              customerName: res.customerName,
              time: "On-Spot Served",
            });
            setTimeout(() => {
              counter.setServeSuccess(null);
              counter.focusScanner();
            }, 1800);
          }}
        />

        {/* Counter Cancel Confirmation Modal */}
        {counter.cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-fadeIn">
            <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-center">
              {/* Status Icon */}
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-rose-500/20 animate-pulse">
                ⚠️
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white font-grotesk tracking-tight mb-2">
                Cancel Booking at Counter?
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mb-6 leading-relaxed font-mono">
                This will cancel booking <span className="font-mono text-emerald-400 font-bold">#{counter.orderData?.HEADER?.BOOKNO}</span> for <strong className="text-white font-semibold">{counter.orderData?.HEADER?.CUSTOMERNAME}</strong> and automatically trigger eligible wallet refunds.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => counter.setCancelModalOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer active:scale-95 border border-slate-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => counter.handleCancel("Cancelled at counter upon customer request")}
                  disabled={counter.cancelLoading}
                  className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-rose-600/30 cursor-pointer uppercase tracking-wider"
                >
                  {counter.cancelLoading ? "Cancelling..." : "Confirm Cancel & Refund"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="p-3 text-center border-t border-slate-900 text-xs text-slate-600 font-mono flex items-center justify-between px-6">
          <span>CMS Serving Counter • Active Shift Mode</span>
          <button
            onClick={() => setTerminalMode("SELF_SERVICE")}
            className="text-slate-400 hover:text-white font-sans underline"
          >
            Switch to Employee Self-Service
          </button>
        </footer>
      </div>
    );
  }

  // ------------------------------------------------------------
  // MODE 2: EMPLOYEE SELF-SERVICE (DEFAULT)
  // ------------------------------------------------------------
  const {
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
    showInactivityWarning,
    inactivityRemaining,
    handleContinueSession,
    handleContinueBookingMore,
    isServiceBooked,
  } = selfService;

  // 2.1 Idle Screen (Waiting for card scan)
  if (!sessionActive || !employeeData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
        {/* Terminal Header */}
        <header className="p-4 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-300 font-mono tracking-wider">
              KIOSK TERMINAL K1
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-500 font-mono">
              OFFLINE READY
            </span>

            {/* Staff Counter Mode Switcher */}
            <button
              onClick={() => setTerminalMode("STAFF_COUNTER")}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              title="Switch to Canteen Staff Serving Screen"
            >
              <span>🛡️</span>
              <span>Staff Counter</span>
            </button>
          </div>
        </header>

        {/* Scan Hero */}
        <KioskScanHero
          inputRef={inputRef}
          identifier={identifier}
          setIdentifier={setIdentifier}
          loading={loading}
          error={error}
          handleScan={handleScan}
        />

        {/* Footer */}
        <footer className="p-4 text-center border-t border-slate-900 text-[11px] text-slate-600 font-mono flex items-center justify-between px-6">
          <span>Canteen Mitra • Self-Service Terminal</span>
          <button
            onClick={() => setTerminalMode("STAFF_COUNTER")}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            Staff Login →
          </button>
        </footer>
      </div>
    );
  }

  // 2.2 Active Employee Session View
  const { customer, wallet, upcomingBookings = [], declinedBookings = [] } = employeeData;
  const activeUpcomingBookings = upcomingBookings.filter(
    (b) => b.statusCode !== "CAN" && b.syncStatus !== "CANCELLED"
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      {/* Active Session Header */}
      <header className="p-3 md:p-4 border-b border-slate-900 bg-slate-900/40 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {customer.displayName ? customer.displayName[0] : "E"}
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white leading-tight">
                {customer.displayName || "Employee"}
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {customer.loginId || customer.customerId} •{" "}
                {customer.customerTypeCode === "PRM"
                  ? "Staff"
                  : customer.customerTypeCode === "CNT"
                    ? "Contractor"
                    : "Visitor"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEndSession}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow"
          >
            End Session ✕
          </button>
        </div>
      </header>

      {/* Main Interactive Canvas */}
      <main className="flex-1 p-3 md:p-6 max-w-4xl mx-auto w-full flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800 max-w-lg mx-auto w-full">
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "bookings"
                ? "bg-slate-800 text-white shadow-md border border-slate-700"
                : "text-slate-400 hover:text-white"
              }`}
          >
            <span>My Bookings ({activeUpcomingBookings.length})</span>
            {declinedBookings.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                !
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("book_next_day")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "book_next_day"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
              }`}
          >
            Book Tomorrow 🍽️
          </button>

          {customer.isWalletEligible && (
            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "wallet"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              Wallet 💳
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === "bookings" && (
            <TodayBookingsTab
              upcomingBookings={activeUpcomingBookings}
              declinedBookings={declinedBookings}
              handleCancelBooking={handleCancelBooking}
              cancellingId={cancellingId}
            />
          )}

          {activeTab === "book_next_day" && (
            <NextDayExpressTab
              targetDate={targetDate}
              availableServices={availableServices}
              servicesLoading={servicesLoading}
              selectedService={selectedService}
              serviceMenu={serviceMenu}
              menuLoading={menuLoading}
              handleSelectService={handleSelectService}
              handleBackToServices={handleBackToServices}
              selectedItems={selectedItems}
              handleQuantityChange={handleQuantityChange}
              handleConfirmBooking={handleConfirmBooking}
              bookingLoading={bookingLoading}
              isServiceBooked={isServiceBooked}
            />
          )}

          {activeTab === "wallet" && <MiniWalletTab wallet={wallet} />}
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmation && (
        <ConfirmationModal
          confirmation={confirmation}
          onBookMore={handleContinueBookingMore}
          onClose={() => {
            setConfirmation(null);
            handleEndSession();
          }}
        />
      )}

      {/* 15-Second Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-amber-500/20 animate-pulse">
              ⏳
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white font-grotesk tracking-tight mb-2">
              Are You Still There?
            </h3>
            <p className="text-xs md:text-sm text-slate-400 mb-6 font-mono leading-relaxed">
              Session will close in{" "}
              <span className="text-amber-400 font-bold text-lg">{inactivityRemaining}</span> seconds to protect your account.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleEndSession}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs md:text-sm transition-all border border-slate-700 cursor-pointer active:scale-95"
              >
                Exit Now
              </button>
              <button
                type="button"
                onClick={handleContinueSession}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs md:text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                I'm Still Ordering
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="p-3 text-center border-t border-slate-900 text-[10px] text-slate-600 font-mono">
        Auto-logout after 2 minutes of inactivity
      </footer>
    </div>
  );
}
