import { useSelfServiceKiosk } from "./hooks/useSelfServiceKiosk";
import { useDragScroll } from "./hooks/useDragScroll";
import KioskScanHero from "./components/KioskScanHero";
import TodayBookingsTab from "./components/TodayBookingsTab";
import NextDayExpressTab from "./components/NextDayExpressTab";
import MiniWalletTab from "./components/MiniWalletTab";
import ConfirmationModal from "./components/ConfirmationModal";

export default function App() {
  useDragScroll();

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
    isServiceBooked,
  } = useSelfServiceKiosk();

  // ------------------------------------------------------------
  // 1. Idle Screen (Waiting for card scan)
  // ------------------------------------------------------------
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
          <span className="text-[11px] font-semibold text-slate-500 font-mono">
            OFFLINE READY
          </span>
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
        <footer className="p-4 text-center border-t border-slate-900 text-[11px] text-slate-600 font-mono">
          Canteen Management System • Self-Service Terminal
        </footer>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 2. Active Employee Session View
  // ------------------------------------------------------------
  const { customer, wallet, upcomingBookings = [] } = employeeData;

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
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "bookings"
                ? "bg-slate-800 text-white shadow-md border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            My Bookings ({upcomingBookings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("book_next_day")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "book_next_day"
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
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "wallet"
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
              upcomingBookings={upcomingBookings}
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
          onClose={() => {
            setConfirmation(null);
            handleEndSession();
          }}
        />
      )}

      {/* Footer */}
      <footer className="p-3 text-center border-t border-slate-900 text-[10px] text-slate-600 font-mono">
        Auto-logout after 60 seconds of inactivity
      </footer>
    </div>
  );
}
