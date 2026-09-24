import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useWeeklyMealPlanner, MAX_WEEKS_AHEAD } from '../hooks/useWeeklyMealPlanner';
import WeekNavHeader from './weekly/WeekNavHeader';
import ServiceTabStrip from './weekly/ServiceTabStrip';
import QuickFillBar from './weekly/QuickFillBar';
import DayPlannerCard from './weekly/DayPlannerCard';
import OrderReviewDrawer from './weekly/OrderReviewDrawer';
import CheckoutBottomBar from './weekly/CheckoutBottomBar';
import CancelBookingModal from './weekly/CancelBookingModal';
import EditBookingModal from './weekly/EditBookingModal';

/**
 * 7-Day Weekly Meal Planner Workspace
 * Orchestrates weekly multi-day pre-booking across available meal services
 */
export default function WeeklyMealPlanner() {
  const {
    canteens,
    selectedCanteen,
    setSelectedCanteen,
    availableServices,
    selectedServiceId,
    setSelectedServiceId,
    activeServiceId,
    activeServiceName,
    weekOffset,
    setWeekOffset,
    weekDates,
    menuData,
    loading,
    fetchError,
    daySelections,
    toggleDaySelection,
    toggleItem,
    updateItemQty,
    resetToSmartDefaults,
    handleSelectAllBaseMeals,
    summary,
    existingBookingsSummary,
    serviceBookingStatus,
    isDrawerOpen,
    setIsDrawerOpen,
    isSubmitting,
    submitSuccess,
    submitError,
    actionMessage,
    cancellingBookingId,
    cancelModalData,
    setCancelModalData,
    confirmCancelMeal,
    editModalData,
    setEditModalData,
    fetchMenu,
    handleConfirmWeeklyBooking,
    isPayrollDeducted,
  } = useWeeklyMealPlanner();

  return (
    <div className="space-y-6">
      {/* ── TOP CONTROL TOOLBAR ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Canteen & Week Selector */}
          <WeekNavHeader
            canteens={canteens}
            selectedCanteen={selectedCanteen}
            onCanteenChange={setSelectedCanteen}
            weekOffset={weekOffset}
            onPrevWeek={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
            onNextWeek={() =>
              setWeekOffset((prev) => Math.min(MAX_WEEKS_AHEAD, prev + 1))
            }
            weekDates={weekDates}
            maxWeeksAhead={MAX_WEEKS_AHEAD}
          />

          {/* Service Filter & Smart Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <ServiceTabStrip
              availableServices={availableServices}
              activeServiceId={activeServiceId}
              onServiceSelect={setSelectedServiceId}
            />

            <QuickFillBar
              onSelectAllBase={handleSelectAllBaseMeals}
              onResetDefaults={resetToSmartDefaults}
              actionMessage={actionMessage}
            />
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
          <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-emerald-900">
              {submitSuccess.message}
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              Total billable amount:{' '}
              <span className="font-bold">₹{submitSuccess.totalAmount}</span>.
              {isPayrollDeducted
                ? ' This will be itemized in your monthly payroll salary slip.'
                : ' This amount has been deducted from your active wallet balance.'}
            </p>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {submitError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
          <XCircleIcon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-900">
              Booking Action Notice
            </h3>
            <p className="text-xs text-rose-700 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* ── 100% FULL-WIDTH 7-DAY WORKSPACE GRID ───────────────────────── */}
      <div className="w-full">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-3" />
            <p className="text-sm font-medium">
              Loading weekly menus & schedules...
            </p>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <InformationCircleIcon className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Weekly Schedule Unavailable
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {fetchError}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
            {weekDates.map((dayDate) => (
              <DayPlannerCard
                key={dayDate.dateStr}
                dayDate={dayDate}
                dayInfo={menuData?.daysMap?.[dayDate.dateStr]}
                daySelect={daySelections[dayDate.dateStr]}
                activeServiceId={activeServiceId}
                activeServiceName={activeServiceName}
                onToggleDay={toggleDaySelection}
                onToggleItem={toggleItem}
                onUpdateQty={updateItemQty}
                onCancelMealClick={setCancelModalData}
                onEditMealClick={setEditModalData}
                cancellingBookingId={cancellingBookingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── STICKY BOTTOM FLOATING SUMMARY BAR WITH EXPANDABLE DRAWER ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-all">
        <OrderReviewDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          summary={summary}
          existingBookingsSummary={existingBookingsSummary}
          isPayrollDeducted={isPayrollDeducted}
        />

        <CheckoutBottomBar
          summary={summary}
          activeServiceName={activeServiceName}
          serviceBookingStatus={serviceBookingStatus}
          isDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          onConfirm={handleConfirmWeeklyBooking}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Cancel Meal Confirmation Modal */}
      <CancelBookingModal
        bookingData={cancelModalData}
        onClose={() => setCancelModalData(null)}
        onConfirm={confirmCancelMeal}
        loading={Boolean(cancellingBookingId)}
      />

      {/* Edit Pre-Booked Meal Modal */}
      <EditBookingModal
        isOpen={Boolean(editModalData)}
        onClose={() => setEditModalData(null)}
        modalData={editModalData}
        onBookingUpdated={fetchMenu}
      />
    </div>
  );
}
