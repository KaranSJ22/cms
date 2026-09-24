export default function ManualSlotModal({
  manualSlotId,
  setManualSlotId,
  todaySlots,
  currentSlot,
}) {
  return (
    <>
      {/* Flexible Meal Service Selector Bar */}
      <div className="w-full mb-3 flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
        <span className="text-[0.68rem] uppercase font-bold text-slate-400 px-2 flex items-center gap-1">
          <span>Meal Mode:</span>
        </span>

        {/* Auto-detect button */}
        <button
          type="button"
          onClick={() => setManualSlotId(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            manualSlotId === null
              ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20 ring-1 ring-orange-400"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <span>🕒 Auto-Detect</span>
        </button>

        {/* Dynamic buttons for each scheduled slot today */}
        {todaySlots.map((slot) => {
          const isSelected = manualSlotId === slot.DAYSLOTID;
          return (
            <button
              key={slot.DAYSLOTID}
              type="button"
              onClick={() => setManualSlotId(slot.DAYSLOTID)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400"
                  : slot.ISCURRENT
                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>{slot.SERVNAME}</span>
              <span className="font-mono text-[0.65rem] opacity-75">
                ({slot.STARTTIME?.substring(0, 5)}–
                {slot.ENDTIME?.substring(0, 5)})
              </span>
              {slot.ISCURRENT && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Flexible Any Service Override */}
        <button
          type="button"
          onClick={() => setManualSlotId("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            manualSlotId === "ALL"
              ? "bg-purple-500 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <span>🌐 All Bookings (Flexible)</span>
        </button>
      </div>

      {/* Live Meal Slot Indicator & Manual Mode Banner */}
      <div className="w-full mb-3">
        {manualSlotId && manualSlotId !== "ALL" ? (
          (() => {
            const lockedSlot = todaySlots.find(
              (s) => s.DAYSLOTID === manualSlotId
            );
            return (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 text-xs font-semibold shadow-lg shadow-emerald-950/30 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="font-bold uppercase tracking-wider text-emerald-300">
                    MANUAL SERVICE OVERRIDE:
                  </span>
                  <span className="text-white font-black text-sm">
                    {lockedSlot?.SERVNAME || "Selected Meal Service"}
                  </span>
                  <span className="text-emerald-400/80 font-mono">
                    ({lockedSlot?.STARTTIME?.substring(0, 5)} –{" "}
                    {lockedSlot?.ENDTIME?.substring(0, 5)})
                  </span>
                </div>
                <div className="text-xs">
                  <span className="bg-emerald-800/60 text-emerald-100 px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold">
                    Late arrivals allowed
                  </span>
                </div>
              </div>
            );
          })()
        ) : manualSlotId === "ALL" ? (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-purple-950/70 border-2 border-purple-500 text-purple-200 text-xs font-semibold shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="font-bold uppercase text-purple-300">
                FLEXIBLE MODE ACTIVE:
              </span>
              <span className="text-white font-bold">
                Dispensing ANY valid booking for today
              </span>
            </div>
            <span className="text-purple-300/80 text-[0.7rem]">
              No slot restriction
            </span>
          </div>
        ) : currentSlot?.ISACTIVENOW ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-lg shadow-emerald-950/20">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-bold uppercase tracking-wider text-emerald-300">
                ACTIVE MEAL SERVICE:
              </span>
              <span className="text-white font-black text-sm">
                {currentSlot.SERVNAME}
              </span>
              <span className="text-emerald-400/80 font-mono">
                ({currentSlot.STARTTIME?.substring(0, 5)} –{" "}
                {currentSlot.ENDTIME?.substring(0, 5)})
              </span>
            </div>
            <div className="text-xs">
              <span className="text-emerald-400/70">Window Closes In: </span>
              <span className="font-mono font-bold text-white">
                {currentSlot.MINUTESREMAINING} mins
              </span>
            </div>
          </div>
        ) : currentSlot?.SLOTSTATE === "UPCOMING" ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-950/20">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="font-bold uppercase tracking-wider text-amber-300">
                UPCOMING SERVICE:
              </span>
              <span className="text-white font-bold text-sm">
                {currentSlot.SERVNAME}
              </span>
              <span className="text-amber-400/80 font-mono">
                (Starts {currentSlot.STARTTIME?.substring(0, 5)})
              </span>
            </div>
            <div className="text-xs">
              <span className="text-amber-300/70">Opens In: </span>
              <span className="font-mono font-bold text-white">
                {currentSlot.MINUTESUNTILSTART} mins
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>No active meal slot running currently</span>
            </span>
            <span className="text-slate-500 text-[0.7rem]">
              Select a slot above or scan to auto-resolve
            </span>
          </div>
        )}
      </div>
    </>
  );
}
