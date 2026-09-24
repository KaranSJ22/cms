import {
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function DayMenuCard({
  dateStr,
  dayName,
  displayDate,
  isWeekend,
  dayInfo,
  activeService,
  slotInfo,
  searchQuery = "",
  onOpenPlanner,
}) {
  const isHoliday = dayInfo?.isHoliday && !dayInfo?.isSpecialHolidayService;
  const holidayName = dayInfo?.holidayName;

  const srvInfo = dayInfo?.services?.[activeService?.SERVICEID];

  // Status
  const slotStatus =
    slotInfo?.APPRSTATUSCODE || slotInfo?.APPRSTATUS || (srvInfo ? "APR" : null);

  const allItems = srvInfo?.items || [];
  const filteredItems = allItems.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (i.ITEMNAME || "").toLowerCase().includes(q) ||
      (i.MENUCODE || "").toLowerCase().includes(q)
    );
  });

  const hasSlot = Boolean(slotInfo || srvInfo);
  const isLive = slotStatus === "APR" || slotStatus === "APP";
  const isPending = slotStatus === "PEN";
  const isDraft = slotStatus === "DRF";

  const timingText = `${
    slotInfo?.STARTTIME?.substring(0, 5) || activeService?.DEFSTART?.substring(0, 5) || "--"
  }–${
    slotInfo?.ENDTIME?.substring(0, 5) || activeService?.DEFEND?.substring(0, 5) || "--"
  }`;

  return (
    <div
      className={`rounded-2xl border flex flex-col bg-white overflow-hidden shadow-xs transition-all h-full ${
        isHoliday
          ? "border-orange-200 bg-orange-50/20"
          : isWeekend && !hasSlot
          ? "border-slate-200 bg-slate-50/40"
          : "border-slate-200"
      }`}
    >
      {/* ── CARD HEADER (UNIFIED) ── */}
      <div
        className={`p-3 border-b transition-colors ${
          isHoliday
            ? "bg-orange-100/80 border-orange-200 text-orange-950"
            : isWeekend
            ? "bg-slate-800 border-slate-700 text-white"
            : "bg-[#0F172A] border-slate-800 text-white"
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <span className="text-xs font-black uppercase tracking-wider block leading-tight">
              {dayName}
            </span>
            <span className="text-[11px] font-semibold opacity-80">{displayDate}</span>
          </div>

          <div>
            {isHoliday ? (
              <span className="text-[9px] font-extrabold bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full whitespace-nowrap">
                🏖️ Holiday
              </span>
            ) : isWeekend ? (
              <span className="text-[9px] font-extrabold bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                Weekend
              </span>
            ) : isLive ? (
              <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                ● LIVE
              </span>
            ) : isPending ? (
              <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse whitespace-nowrap">
                ● PENDING
              </span>
            ) : isDraft ? (
              <span className="text-[9px] font-black bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                DRAFT
              </span>
            ) : (
              <span className="text-[9px] font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                NO SLOT
              </span>
            )}
          </div>
        </div>

        {/* Operating Hours Bar with Direct Link Shortcut */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
          <span className="font-mono text-slate-300 whitespace-nowrap flex items-center gap-1">
            <ClockIcon className="w-3 h-3 text-orange-400 shrink-0" />
            <span>{timingText}</span>
          </span>

          <button
            type="button"
            onClick={() => onOpenPlanner(dateStr, activeService?.SERVICEID)}
            title="Open in Day Menu Planner"
            className="p-0.5 hover:text-orange-400 text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── CARD BODY (FULL WIDTH DISHES — NO NESTED CONTAINER) ── */}
      <div className="p-2.5 flex-1 flex flex-col space-y-2">
        {isHoliday ? (
          <div className="py-8 text-center flex-1 flex flex-col items-center justify-center">
            <span className="text-2xl mb-1">🏖️</span>
            <span className="text-xs font-bold text-orange-950">{holidayName || "Public Holiday"}</span>
            <span className="text-[10px] text-orange-700 mt-0.5 mb-2.5">
              Canteen closed by default
            </span>
            <button
              type="button"
              onClick={() => onOpenPlanner(dateStr, activeService?.SERVICEID)}
              className="px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <PlusIcon className="w-3 h-3" />
              <span>Override & Plan</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center flex-1 flex flex-col items-center justify-center px-1">
            {isWeekend && !hasSlot ? (
              <>
                <span className="text-2xl mb-1.5">☕</span>
                <span className="text-xs font-bold text-slate-600">Weekend Break</span>
                <span className="text-[10px] text-slate-400 mt-0.5 mb-3">No meals scheduled</span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-slate-500 mb-0.5">
                  {hasSlot ? "No Dishes in Slot" : "No Slot Planned"}
                </span>
                <span className="text-[10px] text-slate-400 mb-3">
                  {hasSlot ? "Slot exists without menu" : "Service not scheduled"}
                </span>
              </>
            )}

            <button
              type="button"
              onClick={() => onOpenPlanner(dateStr, activeService?.SERVICEID)}
              className="px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 hover:border-orange-300 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+ Plan Menu</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 flex-1">
            {filteredItems.map((item) => (
              <div
                key={item.DAYMENUID || item.MENUITEMID}
                className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all text-xs space-y-1"
              >
                {/* Dish Name & Price */}
                <div className="flex items-start justify-between gap-1">
                  <span className="font-bold text-slate-800 leading-snug line-clamp-2">
                    {item.ITEMNAME}
                  </span>
                  <span className="font-extrabold text-slate-900 shrink-0 font-mono text-xs">
                    ₹{item.DISPLAYPRICE}
                  </span>
                </div>

                {/* Micro-Tags with whitespace-nowrap to prevent line breaks */}
                <div className="flex items-center justify-between gap-1 text-[10px] pt-0.5">
                  <div className="flex items-center gap-1 shrink-0">
                    {item.ISBASE === 1 && (
                      <span className="font-extrabold px-1.5 py-0.2 rounded text-[9px] bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap">
                        Base
                      </span>
                    )}
                    {item.ISPREBOOK === 1 && (
                      <span className="font-bold px-1.5 py-0.2 rounded text-[9px] bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                        Pre-book
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    Max: {item.MAXQTY || 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
