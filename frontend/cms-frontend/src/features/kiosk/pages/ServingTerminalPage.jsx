import { ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useServingTerminal } from "../hooks/useServingTerminal";
import ShiftLoginCard from "../components/serving/ShiftLoginCard";
import TerminalStatusHeader from "../components/serving/TerminalStatusHeader";
import ManualSlotModal from "../components/serving/ManualSlotModal";
import ScannerInputHero from "../components/serving/ScannerInputHero";
import ActiveBookingCard from "../components/serving/ActiveBookingCard";

export default function ServingTerminalPage() {
  const {
    user,
    canteens,
    selectedCanteenId,
    setSelectedCanteenId,
    canteenLabel,
    shiftLoginId,
    setShiftLoginId,
    shiftPassword,
    setShiftPassword,
    shiftLoginLoading,
    shiftLoginError,
    handleShiftLogin,
    todaySlots,
    manualSlotId,
    setManualSlotId,
    currentSlot,
    identifier,
    setIdentifier,
    activeBooking,
    loading,
    actionLoading,
    error,
    successMsg,
    inputRef,
    handleResolve,
    handleServeAll,
    handleServeItem,
    handleClear,
    isFutureBookingHeader,
    setActiveCanteenId,
  } = useServingTerminal();

  // ------------------------------------------------------------
  // Case A: Operator not logged in -> Show Staff Shift Login Card
  // ------------------------------------------------------------
  if (!user) {
    return (
      <ShiftLoginCard
        shiftLoginId={shiftLoginId}
        setShiftLoginId={setShiftLoginId}
        shiftPassword={shiftPassword}
        setShiftPassword={setShiftPassword}
        shiftLoginLoading={shiftLoginLoading}
        shiftLoginError={shiftLoginError}
        selectedCanteenId={selectedCanteenId}
        setSelectedCanteenId={setSelectedCanteenId}
        canteens={canteens}
        handleShiftLogin={handleShiftLogin}
      />
    );
  }

  // ------------------------------------------------------------
  // Case B: Operator Logged In -> High-Throughput Dispensing Screen
  // ------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 select-none font-inter bg-slate-950 text-slate-100">
      {/* Terminal Sub-Bar with Operator Info & Canteen Switcher */}
      <TerminalStatusHeader
        canteens={canteens}
        selectedCanteenId={selectedCanteenId}
        setSelectedCanteenId={setSelectedCanteenId}
        setActiveCanteenId={setActiveCanteenId}
        canteenLabel={canteenLabel}
        handleClear={handleClear}
      />

      {/* Main Dispensing Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-4">
        {/* Flexible Meal Service Selector Bar & Live Status Indicator */}
        <ManualSlotModal
          manualSlotId={manualSlotId}
          setManualSlotId={setManualSlotId}
          todaySlots={todaySlots}
          currentSlot={currentSlot}
        />

        {/* Hardware / Barcode Scanner Input */}
        <ScannerInputHero
          inputRef={inputRef}
          identifier={identifier}
          setIdentifier={setIdentifier}
          loading={loading}
          actionLoading={actionLoading}
          handleResolve={handleResolve}
        />

        {/* Feedback Alerts */}
        {error && (
          <div className="w-full mb-4 p-4 bg-rose-950/80 border-2 border-rose-600 text-rose-200 rounded-2xl text-center font-bold text-lg animate-in fade-in">
            <p>{typeof error === "object" ? error.message : error}</p>
            {typeof error === "object" && error.correlationId && (
              <p className="text-xs font-mono text-rose-400 mt-1.5 font-normal tracking-wide">
                Ref ID: {error.correlationId}
              </p>
            )}
          </div>
        )}
        {successMsg && (
          <div className="w-full mb-4 p-4 bg-emerald-950/80 border-2 border-emerald-600 text-emerald-200 rounded-2xl text-center font-bold text-lg animate-in fade-in">
            {successMsg}
          </div>
        )}

        {/* Active Booking Card or Ready Prompt */}
        {activeBooking ? (
          <ActiveBookingCard
            activeBooking={activeBooking}
            actionLoading={actionLoading}
            handleClear={handleClear}
            handleServeAll={handleServeAll}
            handleServeItem={handleServeItem}
            isFutureBookingHeader={isFutureBookingHeader}
          />
        ) : (
          !loading &&
          !error && (
            <div className="text-center text-slate-500 py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <ComputerDesktopIcon className="w-10 h-10" />
              </div>
              <p className="text-xl font-bold text-slate-400">
                Ready for next customer
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Tap RFID card on reader or enter booking number above
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
