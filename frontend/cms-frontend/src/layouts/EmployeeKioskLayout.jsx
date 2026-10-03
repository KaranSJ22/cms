import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { useKioskDragScroll } from "../features/kiosk/hooks/useKioskDragScroll";

export default function EmployeeKioskLayout() {
  const scrollRef = useKioskDragScroll();
  const [sessionActive, setSessionActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(45);
  const [exitTrigger, setExitTrigger] = useState(0);

  // Inactivity countdown timer
  useEffect(() => {
    if (!sessionActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time expired, trigger session exit
          handleExit();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionActive]);

  // Reset timer on any user touch/interaction
  const handleUserActivity = useCallback(() => {
    if (sessionActive) {
      setSecondsRemaining(45);
    }
  }, [sessionActive]);

  const handleExit = () => {
    setSessionActive(false);
    setSecondsRemaining(45);
    setExitTrigger((prev) => prev + 1);
  };

  const startSession = () => {
    setSessionActive(true);
    setSecondsRemaining(45);
  };

  return (
    <div
      onPointerDown={handleUserActivity}
      className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 select-none font-inter"
    >
      {/* ── Minimalist Lobby Kiosk Top Bar ── */}
      <header className="h-13 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/logo.png"
            alt="ISRO"
            className="h-7 w-auto object-contain"
          />
          <div>
            <span className="text-xs md:text-sm font-bold text-white uppercase tracking-wider font-grotesk block leading-tight">
              ISRO Self-Service Kiosk
            </span>
            <span className="text-[10px] text-slate-400 font-mono block leading-none">
              Lobby Meal Reservation & Wallet Portal
            </span>
          </div>
        </div>

        {/* Inactivity Watchdog & Exit Button */}
        {sessionActive && (
          <div className="flex items-center gap-3 md:gap-4 animate-in fade-in">
            {/* Countdown Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-700 text-xs font-mono text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Session: {secondsRemaining}s</span>
            </div>

            {/* Exit Touch Button */}
            <button
              type="button"
              onClick={handleExit}
              className="px-4 py-2 rounded-xl text-xs md:text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-600/20"
            >
              Finish / Exit
            </button>
          </div>
        )}
      </header>

      {/* ── Kiosk Main Viewport ── */}
      <main
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto relative flex flex-col touch-pan-y overscroll-y-contain custom-touch-scroll kiosk-scroll-container select-none cursor-grab active:cursor-grabbing"
      >
        <Outlet
          context={{
            sessionActive,
            startSession,
            endSession: handleExit,
            exitTrigger,
            resetWatchdog: handleUserActivity,
          }}
        />
      </main>
    </div>
  );
}
