export default function KioskScanHero({
  inputRef,
  identifier,
  setIdentifier,
  loading,
  error,
  handleScan,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Hardware Reader Pulse Wave */}
      <div className="relative mb-8">
        <div className="w-36 h-36 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg
              className="w-12 h-12 text-emerald-400"
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

      <h1 className="text-4xl md:text-5xl font-black text-white font-grotesk tracking-tight mb-3">
        Tap Your ISRO Smart Card
      </h1>
      <p className="text-lg md:text-xl text-slate-400 max-w-lg mb-8">
        Place your RFID badge on the scanner below to reserve meals, view active
        orders, or check balance.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-600 text-rose-200 font-bold text-lg max-w-md animate-in fade-in">
          <p>{typeof error === "object" ? error.message : error}</p>
          {typeof error === "object" && error.correlationId && (
            <p className="text-xs font-mono text-rose-400 mt-1.5 font-normal tracking-wide">
              Ref ID: {error.correlationId}
            </p>
          )}
        </div>
      )}

      {/* Hardware Keyboard Wedge Input */}
      <form onSubmit={handleScan} className="w-full max-w-md">
        <input
          ref={inputRef}
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={loading}
          placeholder="TAP RFID / ENTER LOGIN ID"
          className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-4 text-2xl font-mono text-center uppercase tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className="hidden" />
      </form>
    </div>
  );
}
