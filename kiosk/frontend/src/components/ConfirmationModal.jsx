import { useEffect, useState } from "react";
import { formatINR } from "../utils/formatters";

export default function ConfirmationModal({ confirmation, onClose }) {
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
  } = confirmation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-3 text-emerald-400 text-3xl shadow-lg shadow-emerald-500/20 animate-pulse">
          ✓
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white font-grotesk tracking-tight mb-1">
          Pre-Booking Confirmed!
        </h2>
        <p className="text-xs text-slate-400 mb-4 font-mono">
          Saved offline • Synced with central kitchen roster
        </p>

        {/* Meal Window & Date Badge */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-left">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Meal Window & Date
              </span>
              <span className="text-base font-bold text-emerald-400">
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
                    <span className="text-emerald-400 font-mono font-bold">×{item.qty}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Identity-Driven Dispensing Notice */}
        <div className="bg-emerald-950/40 border border-emerald-800/80 p-3.5 rounded-2xl text-left mb-6 flex items-start gap-3">
          <div className="text-xl">🪪</div>
          <div>
            <span className="text-xs font-bold text-emerald-300 block mb-0.5">
              Identity-Driven Counter Pickup
            </span>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              No paper token needed! Simply tap your RFID badge or state your Employee ID{" "}
              <strong className="text-white underline">{loginId || "EMP"}</strong> at the serving
              counter tomorrow to collect your meal.
            </p>
          </div>
        </div>

        {/* Action Button with Countdown */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/20 font-mono tracking-wide"
        >
          DONE / NEXT PERSON ({countdown}s)
        </button>
      </div>
    </div>
  );
}
