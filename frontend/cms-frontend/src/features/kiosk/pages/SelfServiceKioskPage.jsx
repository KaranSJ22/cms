import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  WalletIcon,
  CheckCircleIcon,
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
          className={`p-4 rounded-2xl border font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
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
          className={`p-4 rounded-2xl border font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
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
            className={`p-4 rounded-2xl border font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2.5 col-span-2 md:col-span-1 cursor-pointer ${
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
        <TodayBookingsTab
          upcomingBookings={upcomingBookings}
          handleCancelBooking={handleCancelBooking}
          cancellingId={cancellingId}
          setActiveTab={setActiveTab}
        />
      )}

      {/* ── Tab 2: Book Next Day Meal ── */}
      {activeTab === "book_next_day" && (
        <NextDayExpressTab
          nextDayMenu={nextDayMenu}
          menuLoading={menuLoading}
          loadNextDayMenu={loadNextDayMenu}
          selectedItems={selectedItems}
          handleQuantityChange={handleQuantityChange}
          handleConfirmBooking={handleConfirmBooking}
          bookingLoading={bookingLoading}
        />
      )}

      {/* ── Tab 3: Wallet (Contract Workers & Visitors ONLY) ── */}
      {activeTab === "wallet" && (
        <MiniWalletTab customer={customer} wallet={wallet} />
      )}
    </div>
  );
}
