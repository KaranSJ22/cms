import {
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Slide-over drawer showing detailed daily meal items, prices, and existing bookings
 */
export default function OrderReviewDrawer({
  isOpen,
  onClose,
  summary,
  existingBookingsSummary,
  isPayrollDeducted,
}) {
  if (!isOpen) return null;

  return (
    <div className="max-h-72 overflow-y-auto border-b border-slate-200/90 bg-slate-50/95 p-4 sm:p-5 space-y-3.5 animate-in slide-in-from-bottom-3 duration-200 max-w-[1550px] mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
          Weekly Pass Meal Breakdown
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
        >
          <ChevronDownIcon className="w-3.5 h-3.5" />
          Close Breakdown
        </button>
      </div>

      {/* Existing Confirmed Bookings Banner in Summary */}
      {existingBookingsSummary?.count > 0 && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
          <div className="flex justify-between items-center font-bold text-emerald-900 mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              Already Confirmed for this Week:
            </span>
            <span className="font-extrabold text-emerald-800">
              ₹{existingBookingsSummary.totalAmount}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700">
            {existingBookingsSummary.count} meal service
            {existingBookingsSummary.count > 1 ? 's' : ''} active. Cancel individual
            services directly on the day cards above if needed.
          </p>
        </div>
      )}

      {/* Itemized Daily Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {summary.breakdown.length === 0 ? (
          <div className="col-span-full text-center py-4 text-slate-400 italic text-xs">
            {existingBookingsSummary?.count > 0
              ? 'No additional meals selected for this pass.'
              : 'No meals selected yet.'}
          </div>
        ) : (
          summary.breakdown.map((b) => (
            <div
              key={b.dateStr}
              className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs"
            >
              <div className="flex justify-between items-center font-bold text-slate-800 mb-1 pb-1 border-b border-slate-100">
                <span>
                  {b.dayName} ({b.displayDate})
                </span>
                <span className="font-black text-orange-600">
                  ₹{b.dayTotal}
                </span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-500">
                {b.lines.map((l, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="truncate pr-1">• {l.name}</span>
                    <span className="shrink-0 font-semibold text-slate-700">
                      ₹{l.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Customer Type / Billing Context Badge (For Contract Employees) */}
      {!isPayrollDeducted && summary.totalAmount > 0 && (
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span className="font-medium">CMS Wallet Deduction:</span>
          <span className="font-bold text-slate-900">
            ₹{summary.totalAmount} will be deducted from your wallet balance upon
            confirmation
          </span>
        </div>
      )}
    </div>
  );
}
