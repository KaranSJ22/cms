import React, { useState, useEffect, useRef } from "react";
import VirtualKeyboard from "../common/VirtualKeyboard";

export default function CounterShiftLogin({
  staffSession,
  selectedCanteen,
  onSelectCanteen,
  onLogin,
  canteensList = [],
  onExitMode,
}) {
  // Mode: 'RFID' (Default Card Tap) or 'MANUAL' (Touch Keypad / Credentials)
  const [authMode, setAuthMode] = useState("RFID");
  const [activeField, setActiveField] = useState("loginId"); // 'loginId' | 'password'

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rfidBuffer, setRfidBuffer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rfidInputRef = useRef(null);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const errorTimerRef = useRef(null);

  const showError = (msg) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  // Global RFID keystroke capture buffer for hardware card scanners
  useEffect(() => {
    if (authMode === "RFID") {
      rfidInputRef.current?.focus();
    }

    const handleWindowKeyDown = (e) => {
      const now = Date.now();
      const isRapid = now - lastKeyTimeRef.current < 80;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const buffered = bufferRef.current.trim();
        bufferRef.current = "";
        // If there was a rapid burst of characters, it is an RFID badge scan
        if (buffered.length >= 2) {
          e.preventDefault();
          handleRfidScan(buffered.toUpperCase());
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (isRapid || bufferRef.current.length === 0) {
          bufferRef.current += e.key;
        } else {
          bufferRef.current = e.key;
        }
      }
    };

    const handlePointerDown = () => {
      if (authMode === "RFID" && rfidInputRef?.current && document.activeElement !== rfidInputRef.current) {
        setTimeout(() => rfidInputRef.current?.focus(), 60);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [authMode]);

  // Handle direct RFID badge tap
  const handleRfidScan = async (scannedUid) => {
    if (!scannedUid || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onLogin({ rfidUid: scannedUid });
    } catch (err) {
      showError(err.message || "Staff badge not recognized or not authorized");
    } finally {
      setLoading(false);
      setRfidBuffer("");
      if (rfidInputRef?.current) {
        setTimeout(() => rfidInputRef.current?.focus(), 150);
      }
    }
  };

  // Handle touch virtual keyboard clicks
  const handleCharClick = (char) => {
    if (activeField === "loginId") {
      setLoginId((prev) => prev + char);
    } else {
      setPassword((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    if (activeField === "loginId") {
      setLoginId((prev) => prev.slice(0, -1));
    } else {
      setPassword((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (activeField === "loginId") {
      setLoginId("");
    } else {
      setPassword("");
    }
  };

  // Submit manual login
  const handleSubmitManual = async (e) => {
    if (e) e.preventDefault();
    const cleanId = loginId.trim();
    const cleanPwd = password.trim();

    if (!cleanId) {
      showError("Please enter Staff Login ID or tap staff badge");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onLogin({ loginId: cleanId, password: cleanPwd || undefined });
    } catch (err) {
      showError(err.message || "Invalid credentials or unauthorized role");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // STEP 2: CANTEEN SELECTOR (Once authenticated)
  // ------------------------------------------------------------------
  if (staffSession?.user && !selectedCanteen) {
    const userRoles = staffSession.user.canteenRoles || [];
    const availableCanteens =
      userRoles.length > 0
        ? userRoles
        : canteensList.map((c) => ({
            canteenId: c.CANTEENID,
            canteenName: c.CANTEENNAME,
            canteenCode: c.CANTEENCODE,
            roleName: "Staff",
          }));

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 select-none animate-fadeIn">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-emerald-500/20 animate-pulse">
              📍
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white font-grotesk tracking-tight">
              Select Canteen Counter
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1 font-mono">
              Signed in as <span className="text-emerald-400 font-bold">{staffSession.user.fullName}</span> ({staffSession.user.loginId})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            {availableCanteens.map((c) => (
              <button
                key={c.canteenId}
                type="button"
                onClick={() => onSelectCanteen(c)}
                className="p-5 text-left rounded-2xl border border-slate-700/80 bg-slate-800/70 hover:bg-emerald-500/10 hover:border-emerald-500/80 transition-all duration-150 group active:scale-[0.98] cursor-pointer shadow-sm"
              >
                <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-300 uppercase tracking-widest font-mono">
                  {c.canteenCode || `CANTEEN-${c.canteenId}`}
                </div>
                <div className="text-lg font-black text-white mt-1 group-hover:text-emerald-400 font-grotesk">
                  {c.canteenName}
                </div>
                <div className="text-xs text-slate-400 mt-2 font-mono">
                  Role: <span className="text-slate-300 font-semibold">{c.roleName || "Counter Operator"}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onExitMode}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95"
            >
              ← Back to Self-Service
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // STEP 1: SHIFT AUTHENTICATION (RFID TAP vs TOUCH KEYPAD)
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 md:p-6 select-none animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2.5 text-2xl shadow-lg shadow-emerald-500/20">
            🛡️
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white font-grotesk tracking-tight">
            Staff Shift Sign-In
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5 font-mono">
            Canteen Counter Terminal Authentication
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            onClick={() => setError(null)}
            className="mb-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-bold text-center animate-bounce font-mono cursor-pointer flex items-center justify-between gap-2 shadow-lg"
            title="Tap to dismiss"
          >
            <span className="flex-1">{error}</span>
            <span className="text-rose-400 hover:text-white font-mono">✕</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE A: TAP STAFF RFID SMART CARD (DEFAULT)                  */}
        {/* ============================================================ */}
        {authMode === "RFID" ? (
          <div className="flex flex-col items-center justify-center py-4">
            {/* Pulse Reader Animation */}
            <div className="relative mb-5">
              <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-pulse">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <svg className="w-11 h-11 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-white font-grotesk mb-1.5">
              Tap Staff RFID Badge
            </h3>
            <p className="text-xs md:text-sm text-slate-400 max-w-sm text-center mb-6 leading-relaxed">
              Hold staff smart card against the reader to start your serving shift automatically.
            </p>

            {/* Active listener input for USB RFID / barcode scans */}
            <form onSubmit={(e) => { e.preventDefault(); handleRfidScan(rfidBuffer); }} className="w-full max-w-sm mb-5">
              <input
                ref={rfidInputRef}
                type="text"
                value={rfidBuffer}
                onChange={(e) => setRfidBuffer(e.target.value.toUpperCase())}
                disabled={loading}
                placeholder={loading ? "Authenticating Staff..." : "Waiting for badge scan..."}
                className="w-full px-5 py-3.5 bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl text-center text-base font-mono font-bold text-white tracking-widest placeholder-slate-600 outline-none transition-all shadow-inner"
                autoComplete="off"
                autoFocus
              />
            </form>

            {/* Switch to Touch Keypad Button */}
            <button
              type="button"
              onClick={() => {
                setAuthMode("MANUAL");
                setError(null);
              }}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs md:text-sm font-bold rounded-2xl border border-slate-700 shadow-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <span>⌨️</span>
              <span>Type Username & Password (Touch Keypad)</span>
            </button>
          </div>
        ) : (
          /* ============================================================ */
          /* MODE B: ON-SCREEN TOUCH VIRTUAL KEYBOARD                      */
          /* ============================================================ */
          <div className="space-y-4">
            {/* Field 1: Login ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Staff Login ID / Username
                </label>
                {activeField === "loginId" && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                    ● Active Field
                  </span>
                )}
              </div>
              <input
                type="text"
                value={loginId}
                onFocus={() => setActiveField("loginId")}
                onClick={() => setActiveField("loginId")}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter Staff Login ID"
                className={`w-full px-4 py-3 bg-slate-950 border-2 ${
                  activeField === "loginId" ? "border-emerald-500 shadow-emerald-500/10 shadow-lg" : "border-slate-800"
                } rounded-2xl text-white text-base font-mono outline-none transition-all placeholder:text-slate-600`}
                autoComplete="off"
              />
            </div>

            {/* Field 2: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Password / Shift PIN
                </label>
                {activeField === "password" && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                    ● Active Field
                  </span>
                )}
              </div>
              <input
                type="password"
                value={password}
                onFocus={() => setActiveField("password")}
                onClick={() => setActiveField("password")}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full px-4 py-3 bg-slate-950 border-2 ${
                  activeField === "password" ? "border-emerald-500 shadow-emerald-500/10 shadow-lg" : "border-slate-800"
                } rounded-2xl text-white text-base font-mono outline-none transition-all placeholder:text-slate-600`}
                autoComplete="off"
              />
            </div>

            {/* Reusable On-Screen Virtual Keyboard */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 md:p-4">
              <VirtualKeyboard
                onChar={handleCharClick}
                onBackspace={handleBackspace}
                onClear={handleClear}
                onSubmit={handleSubmitManual}
                submitLabel="Sign In to Shift ➔"
                submitDisabled={!loginId.trim()}
                loading={loading}
                compact={true}
                extraActions={
                  <>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setActiveField((f) => (f === "loginId" ? "password" : "loginId"))}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>⇄</span>
                      <span>Switch: {activeField === "loginId" ? "To Password" : "To Login ID"}</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setAuthMode("RFID");
                        setError(null);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🪪</span>
                      <span>Tap Badge Mode</span>
                    </button>
                  </>
                }
              />
            </div>
          </div>
        )}

        {/* Footer / Back to Self Service */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onExitMode}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            ← Back to Self-Service Kiosk
          </button>
        </div>
      </div>
    </div>
  );
}
