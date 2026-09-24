import { XMarkIcon } from "@heroicons/react/24/outline";

export default function DayBookingsDrawer({
  selectedDayBookings,
  loadingDayDetails,
  onClose,
}) {
  if (!selectedDayBookings) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Daily Record
            </span>
            <h3 className="text-base font-black text-slate-900">
              {new Date(selectedDayBookings.dateStr).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {loadingDayDetails ? (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mb-2"></div>
              <p className="text-xs font-medium">Loading dish details...</p>
            </div>
          ) : (
            selectedDayBookings.bookings.map((b) => (
              <div
                key={b.HEADER.BOOKID}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900 text-sm">
                    {b.HEADER.SERVNAME} ({b.HEADER.BOOKNO})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.HEADER.STATUSCODE === "CRT"
                        ? "bg-blue-100 text-blue-800"
                        : b.HEADER.STATUSCODE === "SRV"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {b.HEADER.STATUSCODE === "CRT"
                      ? "Active"
                      : b.HEADER.STATUSCODE === "SRV"
                      ? "Served"
                      : "Cancelled"}
                  </span>
                </div>

                <ul className="space-y-1 text-slate-600 pt-1">
                  {b.ITEMS?.map((item) => (
                    <li key={item.BOOKITEMID || item.BOOKDTID} className="flex justify-between">
                      <span>• {item.ITEMNAME} (x{item.QTY})</span>
                      <span className="font-semibold text-slate-800">
                        ₹{parseFloat(item.AMOUNT).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-slate-200/60 flex justify-between font-bold text-slate-800">
                  <span>Total Amount:</span>
                  <span className="text-slate-900 font-extrabold">
                    ₹{parseFloat(b.HEADER.TOTALAMOUNT).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
