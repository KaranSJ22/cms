import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ArrowRightStartOnRectangleIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";

export default function StaffTerminalLayout() {
  const { user, activeCanteen, logout } = useAuth();
  const navigate = useNavigate();

  // Real-time IST Clock
  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndShift = () => {
    if (window.confirm("Are you sure you want to end your shift and lock this terminal?")) {
      logout();
      navigate("/login");
    }
  };

  const canteenLabel =
    activeCanteen?.CANTEENNAME ||
    user?.CANTEENROLES?.[0]?.CANTEENNAME ||
    "Main Canteen";

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 select-none font-inter">
      {/* ── High-Contrast Kiosk Header ── */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.png"
            alt="ISRO"
            className="h-9 w-auto object-contain"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-grotesk">
                Serving Counter Terminal
              </span>
              <span className="px-2 py-0.5 rounded text-[0.62rem] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
                {canteenLabel}
              </span>
            </div>
            <p className="text-[0.68rem] text-slate-400 font-mono hidden sm:block">
              Raspberry Pi Kiosk Station · High-Throughput RFID Dispenser
            </p>
          </div>
        </div>

        {/* Operator HUD & End Shift */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[0.65rem] uppercase font-bold text-slate-400">
              Active Operator
            </span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {user?.FULLNAME || user?.LOGINID || "Staff Operator"}
            </span>
          </div>

          <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-xs font-mono text-slate-300">
            {timeStr}
          </div>

          <button
            type="button"
            onClick={handleEndShift}
            title="End Shift / Lock Station"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition-colors flex items-center gap-1.5"
          >
            <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
            <span className="hidden md:inline">End Shift</span>
          </button>
        </div>
      </header>

      {/* ── Main Viewport (No Sidebar) ── */}
      <main className="flex-1 min-h-0 overflow-y-auto relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
