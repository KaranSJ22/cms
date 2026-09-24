export default function TerminalStatusHeader({
  canteens,
  selectedCanteenId,
  setSelectedCanteenId,
  setActiveCanteenId,
  canteenLabel,
  handleClear,
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-800/80">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-black tracking-tight text-white font-grotesk">
            Serving Terminal
          </h1>

          {/* Quick Canteen Facility Switcher */}
          {canteens.length > 1 ? (
            <select
              value={selectedCanteenId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedCanteenId(id);
                localStorage.setItem("cms_kiosk_canteen_id", String(id));
                if (setActiveCanteenId) setActiveCanteenId(id);
                handleClear();
              }}
              className="bg-slate-900 border border-orange-500/40 text-orange-400 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer hover:border-orange-400 transition-colors"
              title="Switch Canteen Facility"
            >
              {canteens.map((c) => (
                <option
                  key={c.CANTEENID}
                  value={c.CANTEENID}
                  className="bg-slate-900 text-white"
                >
                  {c.CANTEENNAME} ({c.CANTEENCODE})
                </option>
              ))}
            </select>
          ) : (
            <span className="px-2.5 py-0.5 rounded text-[0.68rem] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {canteenLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Scan Employee RFID badge or type Employee ID / Booking Number
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Scanner Ready (RC522)</span>
        </div>
      </div>
    </div>
  );
}
