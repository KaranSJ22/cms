import { useState } from "react";

export default function KioskScanHero({
  inputRef,
  identifier,
  setIdentifier,
  loading,
  error,
  handleScan,
}) {
  const [showKeypad, setShowKeypad] = useState(false);

  const demoUsers = [
    { id: "perm1", label: "Perm Emp 1", type: "PRM", badge: "Permanent" },
    { id: "cont1", label: "Cont Emp 1", type: "CNT", badge: "Contract" },
    { id: "vis1", label: "Visitor 1", type: "VIS", badge: "Visitor" },
  ];

  const handleKeyPress = (char) => {
    if (char === "BS") {
      setIdentifier((prev) => prev.slice(0, -1));
    } else if (char === "CLR") {
      setIdentifier("");
    } else if (char === "ENTER") {
      handleScan(null);
    } else {
      setIdentifier((prev) => prev + char);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 text-center select-none overflow-y-auto max-w-2xl mx-auto w-full">
      {/* Hardware Reader Pulse Wave (Compact for 7-inch) */}
      <div className="relative mb-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-pulse">
          <div className="w-11 h-11 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <svg
              className="w-6 h-6 text-emerald-400"
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

      <h1 className="text-2xl md:text-3xl font-black text-white font-grotesk tracking-tight mb-1">
        Tap Your ISRO Smart Card
      </h1>
      <p className="text-xs md:text-sm text-slate-400 max-w-md mb-3">
        Tap RFID badge or select a demo profile below to test
      </p>

      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 font-bold text-xs max-w-md animate-in fade-in">
          <p>{typeof error === "object" ? error.message : error}</p>
          {typeof error === "object" && error.correlationId && (
            <p className="text-[10px] font-mono text-rose-400 mt-0.5">
              Ref ID: {error.correlationId}
            </p>
          )}
        </div>
      )}

      {/* Hardware Keyboard Wedge Input */}
      <form onSubmit={handleScan} className="w-full max-w-md mb-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
            placeholder="TAP RFID / ENTER ID"
            className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-2.5 text-xl font-mono text-center uppercase tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            autoComplete="off"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-slate-500 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          )}
          {identifier && !loading && (
            <button
              type="button"
              onClick={() => setIdentifier("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-sm font-bold"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="hidden" />
      </form>

      {/* One-Tap Touch Demo Buttons */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Quick Touch Login:</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {demoUsers.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={loading}
              onClick={() => handleScan(null, u.id)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 active:scale-95 active:border-emerald-500 transition-all flex flex-col items-center justify-center shadow-lg"
            >
              <span className="text-xs font-bold text-white font-mono">{u.id}</span>
              <span className="text-[10px] text-emerald-400 font-medium">{u.badge}</span>
            </button>
          ))}
        </div>

        {/* Toggle On-Screen Touch Numpad */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline decoration-slate-600 underline-offset-4"
          >
            {showKeypad ? "▲ Hide Touch Keypad" : "▼ Open Touch Keypad"}
          </button>
        </div>

        {/* On-Screen Touch Numpad (Expanded) */}
        {showKeypad && (
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-xl mt-2 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleKeyPress(String(n))}
                  className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white font-mono font-bold text-lg active:scale-95 transition-all shadow"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeyPress("CLR")}
                className="h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 active:bg-rose-700 text-rose-300 font-bold text-xs active:scale-95 transition-all shadow"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-white font-mono font-bold text-lg active:scale-95 transition-all shadow"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("BS")}
                className="h-10 rounded-xl bg-amber-950/60 border border-amber-800/80 active:bg-amber-700 text-amber-300 font-bold text-xs active:scale-95 transition-all shadow"
              >
                ⌫
              </button>
            </div>
            <button
              type="button"
              disabled={loading || !identifier.trim()}
              onClick={() => handleScan(null)}
              className="w-full mt-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 disabled:opacity-50 text-white font-bold text-sm shadow-lg active:scale-98 transition-all"
            >
              {loading ? "Verifying..." : "Submit Scan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
