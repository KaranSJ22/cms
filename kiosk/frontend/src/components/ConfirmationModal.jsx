import { useEffect, useState } from "react";
import { formatINR } from "../utils/formatters";

export default function ConfirmationModal({ confirmation, onClose, onBookMore }) {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (countdown <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  if (!confirmation) return null;

  const {
    serviceName,
    serviceDate,
    customerName,
    loginId,
    itemsSummary = [],
    totalAmount,
    offlineUuid,
    bookNo,
    isOfflineRecord,
    disclaimer,
  } = confirmation;

  const isOnline = !isOfflineRecord;
  const displayRef = isOnline
    ? bookNo || "CONFIRMED"
    : (offlineUuid || confirmation.bookingId || "PENDING").slice(0, 8).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div
        className={`bg-slate-900 border-2 ${
          isOnline ? "border-emerald-500" : "border-amber-500"
        } rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-center max-h-[90vh] overflow-y-auto`}
      >
        {/* Status Icon */}
        <div
          className={`w-16 h-16 rounded-full ${
            isOnline
              ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-emerald-500/20"
              : "bg-amber-500/20 border-2 border-amber-500 text-amber-400 shadow-amber-500/20"
          } flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg animate-pulse`}
        >
          {isOnline ? "✓" : "⏳"}
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white font-grotesk tracking-tight mb-1">
          {isOnline ? "Pre-Booking Confirmed!" : "Pre-Booking Saved (Offline)"}
        </h2>
        <p className="text-xs text-slate-400 mb-3 font-mono">
          {isOnline
            ? "Verified & Confirmed Centrally"
            : "Saved locally on kiosk • Will sync automatically upon connection"}
        </p>

        {/* Booking Reference Pill */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${
              isOnline
                ? "bg-emerald-950 text-emerald-300 border border-emerald-700/80"
                : "bg-amber-950 text-amber-300 border border-amber-700/80"
            }`}
          >
            {isOnline ? `Ref: #${displayRef}` : `Offline Local Ref: #${displayRef}`}
          </span>
        </div>

        {/* Meal Window & Date Badge */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-left">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Meal Window & Date
              </span>
              <span className={`text-base font-bold ${isOnline ? "text-emerald-400" : "text-amber-400"}`}>
                {serviceName || "Meal Service"} • {serviceDate}
              </span>
            </div>
            {totalAmount != null && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Total
                </span>
                <span className="text-base font-bold text-white font-mono">
                  {formatINR(totalAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Ordered Dishes List */}
          {itemsSummary.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Selected Dishes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {itemsSummary.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200"
                  >
                    <span>{item.name}</span>
                    <span
                      className={`font-mono font-bold ${
                        isOnline ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      ×{item.qty}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer / Notice */}
        {!isOnline && disclaimer && (
          <div className="bg-amber-950/40 border border-amber-800/80 p-3 rounded-2xl text-left mb-4 flex items-start gap-2.5">
            <span className="text-base">ℹ️</span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed font-mono">
              {disclaimer}
            </p>
          </div>
        )}

        {/* Identity-Driven Dispensing Notice */}
        <div
          className={`${
            isOnline
              ? "bg-emerald-950/40 border-emerald-800/80"
              : "bg-slate-950 border-slate-800"
          } border p-3.5 rounded-2xl text-left mb-6 flex items-start gap-3`}
        >
          <div className="text-xl">🪪</div>
          <div>
            <span
              className={`text-xs font-bold block mb-0.5 ${
                isOnline ? "text-emerald-300" : "text-slate-300"
              }`}
            >
              Identity-Driven Counter Pickup
            </span>
            <p
              className={`text-[11px] leading-relaxed ${
                isOnline ? "text-emerald-200/90" : "text-slate-400"
              }`}
            >
              No paper token needed! Simply tap your RFID badge or state your Employee ID{" "}
              <strong className="text-white underline">{loginId || "EMP"}</strong> at the serving
              counter tomorrow to collect your meal.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onBookMore && (
            <button
              type="button"
              onClick={onBookMore}
              className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-100 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md font-mono tracking-wide"
            >
              ➕ Book Another Meal
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3.5 ${
              isOnline
                ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
                : "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
            } text-slate-950 font-black rounded-xl text-sm transition-all cursor-pointer active:scale-95 shadow-lg font-mono tracking-wide`}
          >
            DONE / EXIT ({countdown}s)
          </button>
        </div>
      </div>
    </div>
  );
}
