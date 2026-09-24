import { XMarkIcon } from "@heroicons/react/24/outline";

export default function BookingDetailModal({ selectedBooking, onClose, user }) {
  if (!selectedBooking) return null;

  const header = selectedBooking.HEADER || {};
  const statusCode = header.STATUSCODE || header.STATUS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Booking Summary
            </span>
            <h3 className="text-lg font-black text-slate-900">
              {header.BOOKNO}
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block font-medium">Meal Service:</span>
              <span className="font-bold text-slate-800 text-sm">
                {header.SERVNAME}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Date:</span>
              <span className="font-bold text-slate-800 text-sm">
                {header.SERVICEDATE ? new Date(header.SERVICEDATE).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }) : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Status:</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  statusCode === "CRT"
                    ? "bg-blue-100 text-blue-800"
                    : statusCode === "SRV"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {statusCode === "CRT"
                  ? "Active"
                  : statusCode === "SRV"
                  ? "Served"
                  : "Cancelled"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Customer:</span>
              <span className="font-bold text-slate-800">
                {header.CUSTOMERNAME || user?.LOGINID}
              </span>
            </div>
          </div>

          {/* Itemized lines */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Itemized Dishes
            </h4>
            {selectedBooking.loadingDetails ? (
              <div className="py-6 flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mb-2"></div>
                <p className="text-xs font-medium">Loading dish details...</p>
              </div>
            ) : selectedBooking.ITEMS && selectedBooking.ITEMS.length > 0 ? (
              <ul className="divide-y divide-slate-100 text-xs">
                {selectedBooking.ITEMS.map((item) => {
                  const isCancelled = item.STATUSCODE === "CAN" || item.STATUSID === 33;
                  return (
                    <li
                      key={item.BOOKITEMID || item.BOOKDTID}
                      className={`py-2.5 flex justify-between items-center ${
                        isCancelled ? "opacity-50 line-through" : ""
                      }`}
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          {item.ITEMNAME || `Dish #${item.DAYMENUID}`}
                        </span>
                        <span className="ml-2 text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          x{item.QTY}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-800">
                        ₹{parseFloat(item.AMOUNT).toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-3 text-xs text-slate-400 italic">No dish items recorded.</p>
            )}
          </div>

          {/* Total Row */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-600">Total Billed:</span>
            <span className="text-xl font-black text-slate-900">
              ₹{parseFloat(header.TOTALAMOUNT || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
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
