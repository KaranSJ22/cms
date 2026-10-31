import React, { useEffect } from "react";

export default function ActiveOrderCard({
  orderData,
  onServe,
  serveLoading,
  onCancelClick,
  onClear,
}) {
  const header = orderData?.HEADER;
  const items = orderData?.ITEMS || [];

  const isServed = header?.STATUSCODE === "SRV";
  const isCancelled = header?.STATUSCODE === "CAN";
  const isReady = header?.STATUSCODE === "CRT" || (!isServed && !isCancelled);

  // Keyboard shortcut: Press Enter to immediately serve (when not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "Enter" && isReady && !serveLoading) {
        e.preventDefault();
        onServe();
      } else if (e.key === "Escape") {
        onClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReady, serveLoading, onServe, onClear]);

  const customerBadge =
    header?.CTYPECODE === "PRM"
      ? { label: "Staff", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" }
      : header?.CTYPECODE === "CNT"
      ? { label: "Contractor", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30" }
      : { label: "Visitor", bg: "bg-purple-500/10 text-purple-400 border-purple-500/30" };

  const firstLetter = (header?.CUSTOMERNAME || "E")[0].toUpperCase();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 select-none max-w-4xl mx-auto w-full animate-fadeIn">
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Header Row with Customer Avatar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xl shadow">
              {firstLetter}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${customerBadge.bg}`}>
                  {customerBadge.label}
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  ID: {header?.LOGINID || header?.CUSTOMERID}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white font-grotesk tracking-tight leading-tight">
                {header?.CUSTOMERNAME || "Customer Name"}
              </h2>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                Token: <span className="text-emerald-400 font-bold">#{header?.BOOKNO}</span> • {header?.SERVNAME || "Meal Slot"}
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="text-right">
            {isReady && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Ready to Serve
              </span>
            )}
            {isServed && (
              <div className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                ⚠️ Already Served {header?.SERVEDON ? `(${String(header.SERVEDON).slice(11, 16)})` : ""}
              </div>
            )}
            {isCancelled && (
              <span className="px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                Cancelled
              </span>
            )}
          </div>
        </div>

        {/* High-Contrast Warning if already served */}
        {isServed && (
          <div className="my-4 p-4 rounded-2xl bg-amber-950/60 border-2 border-amber-600/80 text-amber-200 text-sm flex items-center gap-3 shadow-lg">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-100">Meal Already Collected!</p>
              <p className="text-xs text-amber-300 font-mono mt-0.5">
                Marked served on {header?.SERVEDON ? String(header.SERVEDON).slice(0, 16) : "today"}. Do not dispense duplicate food.
              </p>
            </div>
          </div>
        )}

        {/* Dishes List */}
        <div className="py-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
            Dishes to Dispense ({items.length} items)
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {items.map((item, idx) => (
              <div
                key={item.BOOKITEMID || idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-white shadow-inner"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-lg">
                    🍲
                  </div>
                  <div>
                    <div className="text-sm md:text-base font-bold text-white leading-tight">
                      {item.ITEMNAME || "Dish Item"}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Portion: Standard Canteen Serving
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
                    ×{item.QTY || 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          {/* Giant Serve Target Button */}
          {isReady && (
            <button
              onClick={onServe}
              disabled={serveLoading}
              className="w-full py-4 md:py-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-black text-lg md:text-xl rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 tracking-wide cursor-pointer uppercase"
            >
              {serveLoading ? (
                <>
                  <span className="w-6 h-6 border-3 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></span>
                  <span>Dispensing Order...</span>
                </>
              ) : (
                <>
                  <span>SERVE ORDER ✓</span>
                  <span className="text-xs px-2.5 py-1 rounded bg-black/15 font-mono font-bold text-slate-950">
                    Press [Enter]
                  </span>
                </>
              )}
            </button>
          )}

          {/* Secondary Actions */}
          <div className="flex items-center justify-between pt-1">
            {isReady ? (
              <button
                type="button"
                onClick={onCancelClick}
                className="px-4 py-2.5 text-xs md:text-sm text-rose-400 hover:text-rose-300 font-bold hover:bg-rose-950/40 rounded-xl border border-rose-900/40 transition-all cursor-pointer active:scale-95"
              >
                Cancel Booking & Refund ✕
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="button"
              onClick={onClear}
              className="px-5 py-2.5 text-xs md:text-sm text-slate-300 hover:text-white font-bold bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95 shadow"
            >
              Next Customer (Esc) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
