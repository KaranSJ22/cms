import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Sticky bottom floating summary bar with total cost and primary Confirm CTA
 */
export default function CheckoutBottomBar({
  summary,
  activeServiceName = 'Meal',
  serviceBookingStatus,
  isDrawerOpen,
  onToggleDrawer,
  onConfirm,
  isSubmitting = false,
}) {
  const isAllBooked =
    summary.totalMeals === 0 && Boolean(serviceBookingStatus?.allBooked);

  return (
    <div className="max-w-[1550px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Left Side: Summary Metrics */}
      <div className="flex items-center flex-wrap gap-3 sm:gap-5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isAllBooked
                ? 'bg-emerald-500'
                : 'bg-orange-500 animate-pulse'
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Weekly Pass
          </span>
        </div>

        {isAllBooked ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold shadow-2xs">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All {serviceBookingStatus.bookedDays} Days Booked for {activeServiceName} this week
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="bg-slate-100 px-3 py-1 rounded-lg font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
              <span>{summary.totalDays} of 7 Days Included</span>
            </div>

            <div className="bg-slate-100 px-3 py-1 rounded-lg font-bold text-slate-700">
              🍱 {summary.totalMeals} Items Selected
            </div>

            <div className="flex items-baseline gap-1 font-mono pl-1">
              <span className="text-xs text-slate-400 font-sans">Total:</span>
              <span className="text-xl sm:text-2xl font-black text-[#0F172A]">
                ₹{summary.totalAmount}
              </span>
            </div>
          </div>
        )}

        {/* Breakdown Drawer Toggle (shown when items are selected) */}
        {summary.totalMeals > 0 && (
          <button
            type="button"
            onClick={onToggleDrawer}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isDrawerOpen ? 'Hide Breakdown' : 'View Breakdown'}</span>
            {isDrawerOpen ? (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Right Side: Primary CTA */}
      <div className="flex items-center gap-3">
        {isAllBooked ? (
          <div className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Reservation Confirmed</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || summary.totalDays === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Confirming Pass...</span>
              </>
            ) : (
              <>
                <span>
                  {summary.totalMeals > 0
                    ? `Confirm Weekly ${activeServiceName} Pass (₹${summary.totalAmount})`
                    : `Select ${activeServiceName} to Confirm`}
                </span>
                <SparklesIcon className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
