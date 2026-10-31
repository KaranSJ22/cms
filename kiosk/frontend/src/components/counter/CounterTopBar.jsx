import React, { useState, useEffect } from "react";
import { kioskApi } from "../../api/kioskApi";

export default function CounterTopBar({
  staffSession,
  selectedCanteen,
  activeSlot,
  todaySlots = [],
  onSelectSlot,
  onOpenOnSpot,
  onSwitchCanteen,
  onLogout,
}) {
  const staffName = staffSession?.user?.fullName || "Counter Staff";
  const staffRole = staffSession?.user?.canteenRoles?.[0]?.roleName || "Staff";

  const [healthStatus, setHealthStatus] = useState({ online: true, pendingOutbox: 0 });

  useEffect(() => {
    let mounted = true;
    const checkStatus = () => {
      kioskApi
        .getHealth()
        .then((res) => {
          if (!mounted) return;
          const data = res.data?.DATA || res.data || {};
          setHealthStatus({
            online: true,
            pendingOutbox: data.outbox?.pendingBookings || 0,
          });
        })
        .catch(() => {
          if (!mounted) return;
          setHealthStatus((prev) => ({ ...prev, online: false }));
        });
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="p-3 md:p-4 border-b border-slate-900 bg-slate-900/40 backdrop-blur sticky top-0 z-40 select-none">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Left: Terminal Scope & Canteen */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest font-black text-emerald-400 font-mono">
              Serving Counter
            </span>
          </div>

          {/* Sync Status Badge */}
          {healthStatus.pendingOutbox > 0 ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              OFFLINE QUEUE ({healthStatus.pendingOutbox})
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {healthStatus.online ? "ONLINE" : "OFFLINE READY"}
            </span>
          )}

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          {/* Canteen Facility Pill */}
          <button
            type="button"
            onClick={onSwitchCanteen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-all cursor-pointer active:scale-95 shadow"
            title="Click to switch operating canteen"
          >
            <span>📍 {selectedCanteen?.canteenName || "Canteen Facility"}</span>
            <span className="text-[10px] text-slate-400">⇄</span>
          </button>

          {/* Meal Slot Badge */}
          {activeSlot ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span>🍲 {activeSlot.SERVNAME || "Meal Slot"}</span>
              <span className="text-[10px] text-emerald-300 font-mono">
                ({activeSlot.STARTTIME ? String(activeSlot.STARTTIME).slice(0, 5) : ""} -{" "}
                {activeSlot.ENDTIME ? String(activeSlot.ENDTIME).slice(0, 5) : ""})
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 italic font-mono">No slot active</div>
          )}
        </div>

        {/* Right: Actions & Staff Profile */}
        <div className="flex items-center gap-2.5">
          {/* On-Spot Surplus Food Button */}
          <button
            type="button"
            onClick={onOpenOnSpot}
            className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>➕</span>
            <span>On-Spot Food (Walk-In)</span>
          </button>

          {/* Staff Identity */}
          <div className="hidden sm:flex flex-col text-right pr-1">
            <span className="text-xs font-bold text-white leading-tight">{staffName}</span>
            <span className="text-[10px] text-slate-400 font-mono">{staffRole}</span>
          </div>

          {/* End Shift / Logout Button - Identical to End Session in Self-Service */}
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow"
          >
            End Shift ✕
          </button>
        </div>
      </div>
    </header>
  );
}
