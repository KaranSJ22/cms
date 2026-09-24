import { XCircleIcon, UsersIcon, EyeIcon } from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";

export default function PayrollDataTable({
  loading,
  error,
  employees = [],
  summary = {},
  handleOpenDetail,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Computing monthly payroll report...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center text-rose-500 space-y-2">
          <XCircleIcon className="w-8 h-8 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="p-16 text-center text-slate-400 space-y-2">
          <UsersIcon className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No Billing Records Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No meal bookings were found for Permanent or Other Centre Employees matching the selected period and filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Login ID</th>
                <th className="py-3.5 px-4">Employee Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Days Booked</th>
                <th className="py-3.5 px-4 text-center">Meals Breakdown</th>
                <th className="py-3.5 px-4">Canteens Used</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center print:hidden">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {employees.map((emp) => {
                const isPermanent =
                  emp.CTYPECODE === "PRM" || emp.CTYPECODE === "PERMEMP";
                return (
                  <tr
                    key={emp.CUSTOMERID}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Login ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                        {emp.LOGINID}
                      </span>
                    </td>

                    {/* Employee Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {emp.FULLNAME}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {emp.EMPCODE && `Code: ${emp.EMPCODE}`}
                        {emp.DEPT && ` • ${emp.DEPT}`}
                        {emp.DESIG && ` (${emp.DESIG})`}
                      </div>
                      {emp.CENTERNAME && (
                        <div className="text-[10px] text-purple-600 font-semibold">
                          Centre: {emp.CENTERNAME}
                        </div>
                      )}
                    </td>

                    {/* Category Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          isPermanent
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {isPermanent ? "Permanent Staff" : "Other Centre"}
                      </span>
                    </td>

                    {/* Days Booked */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block font-bold text-slate-800 text-sm">
                        {emp.DAYS_BOOKED}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        days
                      </span>
                    </td>

                    {/* Meals Breakdown */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          title="Served"
                        >
                          {emp.SERVED_BOOKINGS} Srv
                        </span>
                        {emp.NOSHOW_BOOKINGS > 0 && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                            title="No-Show"
                          >
                            {emp.NOSHOW_BOOKINGS} No-Show
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px] font-normal">
                          ({emp.TOTAL_BOOKINGS} tot)
                        </span>
                      </div>
                    </td>

                    {/* Canteens Used */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-normal max-w-xs truncate">
                        {emp.CANTEENS_USED ? (
                          emp.CANTEENS_USED.split(", ").map((canName, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full mr-1 mb-1 border border-slate-200"
                            >
                              {canName}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </div>
                    </td>

                    {/* Total Monthly Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-slate-900">
                      {formatINR(emp.TOTAL_AMOUNT)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(emp)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition-all border border-slate-200 flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                <td colSpan={3} className="py-3 px-4 uppercase text-slate-500 text-xs">
                  Grand Total ({employees.length} Employees)
                </td>
                <td className="py-3 px-4 text-center text-sm">
                  {summary.totalDaysBooked || 0}
                </td>
                <td className="py-3 px-4 text-center text-xs text-slate-600">
                  {summary.totalServed || 0} Served / {summary.totalBookings || 0} Total
                </td>
                <td className="py-3 px-4 text-slate-400 text-xs">—</td>
                <td className="py-3 px-4 text-right text-base text-orange-600 font-mono">
                  {formatINR(summary.totalAmount || 0)}
                </td>
                <td className="py-3 px-4 print:hidden" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
