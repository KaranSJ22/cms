import { useState, useEffect, useRef } from "react";

const KEYBOARD_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function KioskScanHero({
  inputRef,
  identifier,
  setIdentifier,
  loading,
  error,
  handleScan,
}) {
  const [manualMode, setManualMode] = useState(false);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  // Global RFID keystroke capture buffer and touch-refocus trap
  useEffect(() => {
    if (manualMode) return;

    // Immediately focus on mount / mode switch
    inputRef?.current?.focus();

    const handleWindowKeyDown = (e) => {
      if (manualMode) return;

      const now = Date.now();
      const isRapid = now - lastKeyTimeRef.current < 80;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const buffered = bufferRef.current.trim();
        bufferRef.current = "";
        if (buffered.length >= 4) {
          e.preventDefault();
          handleScan(null, buffered.toUpperCase());
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Accumulate rapid burst characters (alphanumeric and colon)
        if (isRapid || bufferRef.current.length === 0) {
          bufferRef.current += e.key;
        } else {
          bufferRef.current = e.key;
        }
      }
    };

    const handlePointerDown = () => {
      // Re-focus input if touch happened outside
      if (!manualMode && inputRef?.current && document.activeElement !== inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [manualMode, handleScan, inputRef]);

  const handleCharClick = (char) => {
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
    handleScan(null, identifier.trim().toUpperCase());
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
        /* MODE A: RFID SMART CARD TAP (DEFAULT)                         */
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
            Tap Your Smart Card
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-md mb-6 leading-relaxed">
            Hold your RFID badge against the reader to pre-book tomorrow's meals or review upcoming bookings.
          </p>

          {/* Hidden/Active input that receives RFID Virtual Keyboard Keystrokes */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm mb-5">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                disabled={loading}
                placeholder={loading ? "Verifying..." : "Waiting for card scan..."}
                className="w-full px-5 py-3.5 bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl text-center text-lg font-mono font-bold text-white tracking-widest placeholder-slate-600 outline-none transition-all shadow-inner"
                autoComplete="off"
                autoFocus
              />
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-600 text-rose-200 text-sm font-bold rounded-2xl animate-bounce">
              {error.message || error}
            </div>
          )}

          {/* Prominent High-Contrast Manual Mode Touch Button */}
          <button
            type="button"
            onClick={handleSwitchToManual}
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 text-sm font-bold rounded-2xl border border-slate-600 shadow-xl transition-all cursor-pointer flex items-center gap-2.5"
          >
            <span className="text-lg">⌨️</span>
            <span>Enter Employee / Login ID Manually</span>
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
                Enter Employee ID
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Type your Employee Code (e.g. EMP1042) or Login ID
              </p>
            </div>
            <button
              type="button"
              onClick={handleSwitchToRfid}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>✕</span>
              <span>Back to Card Tap</span>
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
            <div className="mb-4 p-2.5 bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-bold rounded-xl">
              {error.message || error}
            </div>
          )}

          {/* Touch QWERTY Keyboard */}
          <div className="space-y-2 mb-4">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1.5 md:gap-2">
                {row.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleCharClick(char)}
                    className="flex-1 max-w-[58px] h-12 md:h-14 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-base md:text-lg rounded-xl border border-slate-700 shadow transition-all cursor-pointer flex items-center justify-center"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Control Bar: Clear, Backspace, Submit */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              onClick={handleClear}
              className="h-12 md:h-14 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs md:text-sm rounded-xl border border-slate-700 transition-all cursor-pointer uppercase tracking-wider"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 md:h-14 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 font-bold text-base md:text-lg rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <span>⌫</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !identifier.trim()}
              className="col-span-2 h-12 md:h-14 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 active:scale-95 text-slate-950 font-black text-sm md:text-base rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <span>➔</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
