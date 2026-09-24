import { XMarkIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";

export default function EmployeeBreakdownModal({
  detailModalOpen,
  selectedCustomer,
  breakdownLoading,
  breakdownError,
  breakdownData,
  handleCloseDetail,
}) {
  if (!detailModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#0F172A] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-orange-400">
              <span>LOGIN ID: {selectedCustomer?.LOGINID}</span>
              <span>•</span>
              <span>CODE: {selectedCustomer?.EMPCODE || "N/A"}</span>
            </div>
            <h3 className="text-lg font-bold text-white font-grotesk mt-0.5">
              {selectedCustomer?.FULLNAME} — Monthly Itemized Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              {selectedCustomer?.DEPT} • {selectedCustomer?.DESIG}{" "}
              {selectedCustomer?.CENTERNAME && `(${selectedCustomer.CENTERNAME})`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseDetail}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {breakdownLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
              <p className="text-xs font-medium">Fetching itemized bookings...</p>
            </div>
          ) : breakdownError ? (
            <div className="py-12 text-center text-rose-500 space-y-2">
              <XCircleIcon className="w-8 h-8 mx-auto" />
              <p className="text-sm font-semibold">{breakdownError}</p>
            </div>
          ) : !breakdownData?.bookings || breakdownData.bookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">No active bookings recorded for this period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {breakdownData.bookings.map((booking) => (
                <div
                  key={booking.BOOKID}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3"
                >
                  {/* Booking Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {booking.SERVICEDATE}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {booking.SERVNAME}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
                        {booking.CANTEENNAME}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          booking.STATUSCODE === "SRV"
                            ? "bg-emerald-100 text-emerald-800"
                            : booking.STATUSCODE === "NOS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {booking.STATUSNAME || booking.STATUSCODE}
                      </span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatINR(booking.TOTALAMOUNT)}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-slate-100 text-xs">
                    {booking.ITEMS?.map((item) => (
                      <div
                        key={item.BOOKITEMID}
                        className="py-1.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span className="font-medium text-slate-800">
                            {item.ITEMNAME}
                          </span>
                          {item.MENUCODE && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({item.MENUCODE})
                            </span>
                          )}
                          <span className="text-slate-500 font-mono font-semibold">
                            × {item.QTY}
                          </span>
                        </div>
                        <div className="font-mono text-slate-600">
                          {formatINR(item.AMOUNT)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total Month Deduction:{" "}
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatINR(selectedCustomer?.TOTAL_AMOUNT)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCloseDetail}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
