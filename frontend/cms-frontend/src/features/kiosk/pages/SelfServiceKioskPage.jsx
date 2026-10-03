import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  WalletIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { formatINR } from "../../../utils/formatters";
import { useSelfServiceKiosk } from "../hooks/useSelfServiceKiosk";
import KioskScanHero from "../components/selfservice/KioskScanHero";
import TodayBookingsTab from "../components/selfservice/TodayBookingsTab";
import NextDayExpressTab from "../components/selfservice/NextDayExpressTab";
import MiniWalletTab from "../components/selfservice/MiniWalletTab";

export default function SelfServiceKioskPage() {
  const {
    sessionActive,
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
  } = useSelfServiceKiosk();

  // ------------------------------------------------------------
  // 1. Idle Screen (Waiting for card scan)
  // ------------------------------------------------------------
  if (!sessionActive || !employeeData) {
    return (
      <KioskScanHero
        inputRef={inputRef}
        identifier={identifier}
        setIdentifier={setIdentifier}
        loading={loading}
        error={error}
        handleScan={handleScan}
      />
    );
  }

  // ------------------------------------------------------------
  // 2. Active Session View
  // ------------------------------------------------------------
  const { customer, wallet, upcomingBookings = [] } = employeeData;

  return (
    <div className="flex-1 flex flex-col p-3 md:p-6 max-w-5xl mx-auto w-full space-y-3">
      {/* ── Employee Profile Welcome Header ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg flex flex-row justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Active Session
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
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
          <h2 className="text-lg md:text-xl font-black text-white font-grotesk mt-0.5 leading-tight">
            {customer.displayName || "Employee"}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono">
            ID: {customer.loginId || customer.customerId}
          </p>
        </div>

        {/* Financial Billing Badge */}
        <div>
          {customer.isWalletEligible && wallet ? (
            <div className="bg-emerald-950/60 border border-emerald-800/80 px-3.5 py-2 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block leading-tight">
                Prepaid Wallet
              </span>
              <p className="text-xl md:text-2xl font-black text-white font-mono leading-tight">
                {formatINR(wallet.balance)}
              </p>
              {wallet.reserved > 0 && (
                <span className="text-[10px] text-slate-400">
                  (Hold: {formatINR(wallet.reserved)})
                </span>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">
                Billing Model
              </span>
              <p className="text-xs md:text-sm font-bold text-slate-200 mt-0.5">
                Monthly Subsidized
              </p>
              <span className="text-[10px] text-emerald-400">
                ✓ No Advance Wallet
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Feedback Message ── */}
      {successMsg && (
        <div className="p-2.5 bg-emerald-950/80 border border-emerald-600 text-emerald-200 rounded-xl text-center font-bold text-xs animate-in fade-in flex items-center justify-center gap-2">
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-2.5 bg-rose-950/80 border border-rose-600 text-rose-200 rounded-xl text-center font-bold text-xs animate-in fade-in flex items-center justify-center gap-2">
          <XCircleIcon className="w-4 h-4 shrink-0" />
          <span>{typeof error === "string" ? error : error.message}</span>
        </div>
      )}

      {/* ── Mode Selection Touch Tabs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            resetWatchdog?.();
            setActiveTab("bookings");
          }}
          className={`p-2.5 rounded-xl border font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
            activeTab === "bookings"
              ? "bg-slate-100 text-slate-950 border-white shadow-md"
              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
          }`}
        >
          <ClipboardDocumentListIcon className="w-4 h-4 shrink-0" />
          <span>Recent Bookings ({upcomingBookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            resetWatchdog?.();
            setActiveTab("book_next_day");
          }}
          className={`p-2.5 rounded-xl border font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
            activeTab === "book_next_day"
              ? "bg-orange-500 text-slate-950 border-orange-400 shadow-md shadow-orange-500/20"
              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
          }`}
        >
          <CalendarDaysIcon className="w-4 h-4 shrink-0" />
          <span>Book Tomorrow</span>
        </button>

        {customer.isWalletEligible && (
          <button
            type="button"
            onClick={() => {
              resetWatchdog?.();
              setActiveTab("wallet");
            }}
            className={`p-2.5 rounded-xl border font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 col-span-2 md:col-span-1 cursor-pointer active:scale-98 ${
              activeTab === "wallet"
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
            }`}
          >
            <WalletIcon className="w-4 h-4 shrink-0" />
            <span>Wallet Account</span>
          </button>
        )}
      </div>

      {/* ── Tab 1: Active Bookings (View & Cancel) ── */}
      {activeTab === "bookings" && (
        <TodayBookingsTab
          upcomingBookings={upcomingBookings}
          handleCancelBooking={handleCancelBooking}
          cancellingId={cancellingId}
          setActiveTab={setActiveTab}
          handleStartEditBooking={handleStartEditBooking}
          targetDate={targetDate}
        />
      )}

      {/* ── Tab 2: Book Next Day Meal ── */}
      {activeTab === "book_next_day" && (
        <NextDayExpressTab
          targetDate={targetDate}
          availableServices={availableServices}
          servicesLoading={servicesLoading}
          loadNextDayServices={loadNextDayServices}
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
          getServiceBooking={getServiceBooking}
          setActiveTab={setActiveTab}
          editingBooking={editingBooking}
          handleStartEditBooking={handleStartEditBooking}
        />
      )}

      {/* ── Tab 3: Wallet (Contract Workers & Visitors ONLY) ── */}
      {activeTab === "wallet" && (
        <MiniWalletTab customer={customer} wallet={wallet} />
      )}
    </div>
  );
}
