export default function ScannerInputHero({
  inputRef,
  identifier,
  setIdentifier,
  loading,
  actionLoading,
  handleResolve,
}) {
  return (
    <form onSubmit={handleResolve} className="w-full mb-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={loading || actionLoading}
          placeholder="SCAN RFID / ENTER ID"
          className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-5 text-3xl font-mono text-center uppercase tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all disabled:opacity-50"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div className="w-7 h-7 border-3 border-slate-500 border-t-orange-400 rounded-full animate-spin" />
          </div>
        )}
        <button type="submit" className="hidden" />
      </div>
    </form>
  );
}
