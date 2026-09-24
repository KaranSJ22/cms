import {
  UsersIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";

export default function PayrollKPISection({ summary = {} }) {
  const {
    totalEmployees = 0,
    totalDaysBooked = 0,
    totalBookings = 0,
    totalServed = 0,
    totalNoShow = 0,
    totalAmount = 0,
  } = summary;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Billed Staff */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <UsersIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Employees
          </p>
          <p className="text-2xl font-black font-grotesk text-slate-800">
            {totalEmployees}
          </p>
        </div>
      </div>

      {/* Days Booked (Cumulative) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <CalendarDaysIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cumulative Days
          </p>
          <p className="text-2xl font-black font-grotesk text-slate-800">
            {totalDaysBooked}
          </p>
        </div>
      </div>

      {/* Meals Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircleIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Meals (Served / Total)
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black font-grotesk text-slate-800">
              {totalServed}
            </span>
            <span className="text-xs font-medium text-slate-400">
              / {totalBookings}
            </span>
            {totalNoShow > 0 && (
              <span className="text-xs font-semibold text-amber-600 ml-1">
                ({totalNoShow} No-Show)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Total Monthly Amount */}
      <div className="bg-white rounded-2xl p-5 border border-orange-200 bg-gradient-to-br from-white to-orange-50/40 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25">
          <BanknotesIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Total Deduction
          </p>
          <p className="text-2xl font-black font-grotesk text-slate-900">
            {formatINR(totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
