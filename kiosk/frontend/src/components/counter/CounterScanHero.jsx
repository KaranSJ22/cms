import React, { useState, useEffect, useRef } from "react";
import VirtualKeyboard from "../common/VirtualKeyboard";

export default function CounterScanHero({
  identifier,
  setIdentifier,
  onScan,
  loading,
  error,
  inputRef,
  disabled = false,
  onDismissError,
}) {
  const [manualMode, setManualMode] = useState(false);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  // Global RFID keystroke capture buffer and touch-refocus trap
  useEffect(() => {
    if (manualMode || disabled) return;

    inputRef?.current?.focus();

    const handleWindowKeyDown = (e) => {
      if (manualMode || disabled) return;

      const now = Date.now();
      const isRapid = now - lastKeyTimeRef.current < 80;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const buffered = bufferRef.current.trim();
        bufferRef.current = "";
        if (buffered.length >= 2) {
          e.preventDefault();
          onScan(buffered.toUpperCase());
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
      if (!manualMode && !disabled && inputRef?.current && document.activeElement !== inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [manualMode, disabled, onScan, inputRef]);

  const handleCharClick = (char) => {
    if (onDismissError) onDismissError();
    setIdentifier((prev) => (prev + char).toUpperCase());
  };

  const handleBackspace = () => {
    setIdentifier((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setIdentifier("");
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!identifier || !identifier.trim()) return;
    onScan(identifier.trim().toUpperCase());
  };

  const handleSwitchToManual = () => {
    setManualMode(true);
    setIdentifier("");
  };

  const handleSwitchToRfid = () => {
    setManualMode(false);
    setIdentifier("");
    if (inputRef?.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 text-center select-none max-w-3xl mx-auto w-full">
      {!manualMode ? (
        /* ============================================================ */
        /* MODE A: RFID SMART CARD TAP / SCANNER (DEFAULT)               */
        /* ============================================================ */
        <div className="flex flex-col items-center justify-center w-full max-w-lg">
          {/* Hardware Reader Pulse Wave */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-pulse">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg
                  className="w-11 h-11 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white font-grotesk tracking-tight mb-2">
            Ready to Serve
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-md mb-6 leading-relaxed">
            Tap customer RFID badge on the reader or type Employee Code / Booking Token to retrieve active order.
          </p>

          {/* Form input that receives scanner keystrokes */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm mb-5">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                disabled={loading}
                placeholder={loading ? "Resolving Order..." : "Waiting for badge scan..."}
                className="w-full px-5 py-3.5 bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl text-center text-lg font-mono font-bold text-white tracking-widest placeholder-slate-600 outline-none transition-all shadow-inner"
                autoComplete="off"
                autoFocus
              />
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div
              onClick={() => onDismissError && onDismissError()}
              className="mb-5 p-3.5 bg-rose-950/80 border border-rose-600 text-rose-200 text-sm font-bold rounded-2xl animate-bounce flex items-center justify-between gap-3 cursor-pointer shadow-lg"
              title="Click to dismiss"
            >
              <span>{error.message || error}</span>
              <span className="text-xs text-rose-400 hover:text-white font-mono">✕</span>
            </div>
          )}

          {/* Touch Button to Switch to Keypad */}
          <button
            type="button"
            onClick={handleSwitchToManual}
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 text-sm font-bold rounded-2xl border border-slate-600 shadow-xl transition-all cursor-pointer flex items-center gap-2.5"
          >
            <span className="text-lg">⌨️</span>
            <span>Enter Code Manually (On-Screen Keypad)</span>
          </button>
        </div>
      ) : (
        /* ============================================================ */
        /* MODE B: ON-SCREEN ALPHANUMERIC VIRTUAL KEYBOARD               */
        /* ============================================================ */
        <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="text-left">
              <h2 className="text-xl md:text-2xl font-black text-white font-grotesk tracking-tight">
                Enter Code or Token
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Type Employee Code (e.g. P001), Contractor ID (e.g. C001), or Token (PB...)
              </p>
            </div>
            <button
              type="button"
              onClick={handleSwitchToRfid}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>✕</span>
              <span>Back to Card Scan</span>
            </button>
          </div>

          {/* Large Alphanumeric Display Box */}
          <div className="mb-4">
            <div className="w-full px-4 py-3.5 bg-slate-950 border-2 border-emerald-500/70 rounded-2xl text-center text-2xl md:text-3xl font-mono font-black text-emerald-400 tracking-wider min-h-[64px] flex items-center justify-center shadow-inner">
              {identifier ? (
                identifier
              ) : (
                <span className="text-slate-600 text-lg font-normal tracking-normal">
                  Type ID using touch keys below...
                </span>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              onClick={() => onDismissError && onDismissError()}
              className="mb-4 p-2.5 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-bold rounded-xl flex items-center justify-between gap-2 cursor-pointer shadow-lg"
              title="Click to dismiss"
            >
              <span>{error.message || error}</span>
              <span className="text-rose-400 hover:text-white font-mono">✕</span>
            </div>
          )}

          {/* Reusable Touch Virtual Keyboard */}
          <VirtualKeyboard
            onChar={handleCharClick}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onSubmit={handleSubmit}
            submitLabel="Lookup Order ➔"
            submitDisabled={!identifier.trim()}
            loading={loading}
            uppercaseOnly={true}
          />
        </div>
      )}
    </div>
  );
}
