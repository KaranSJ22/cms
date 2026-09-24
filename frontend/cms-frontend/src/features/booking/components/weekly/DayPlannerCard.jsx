import {
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import MealItemRow from './MealItemRow';
import { getServiceEmoji } from '../../../../utils/serviceEmoji';

/**
 * Individual column / card for a single day in the 7-day weekly grid
 */
export default function DayPlannerCard({
  dayDate,
  dayInfo,
  daySelect,
  activeServiceId,
  activeServiceName,
  onToggleDay,
  onToggleItem,
  onUpdateQty,
  onCancelMealClick,
  onEditMealClick,
  cancellingBookingId,
}) {
  const { dateStr, dayName, displayDate, isWeekend } = dayDate;

  const isHoliday = dayInfo?.isHoliday && !dayInfo?.isSpecialHolidayService;
  const holidayName = dayInfo?.holidayName;

  const servicesList = dayInfo?.services
    ? Object.values(dayInfo.services)
    : [];
  const filteredServices = servicesList.filter((srv) => {
    if (!activeServiceId) return false;
    return String(srv.serviceId) === String(activeServiceId);
  });

  const hasExistingBookings = filteredServices.some((srv) =>
    Boolean(srv.existingBooking)
  );
  const allServicesBooked =
    filteredServices.length > 0 &&
    filteredServices.every((srv) => Boolean(srv.existingBooking));
  const allServicesServed =
    filteredServices.length > 0 &&
    filteredServices.every(
      (srv) => srv.existingBooking?.STATUSCODE === 'SRV'
    );
  const isDaySelected = daySelect?.selected && !isHoliday;

  return (
    <div
      className={`rounded-2xl border transition-all flex flex-col h-full overflow-hidden ${
        isHoliday
          ? 'bg-slate-50/70 border-slate-200 opacity-60'
          : allServicesServed
          ? 'bg-blue-50/30 border-blue-200 shadow-sm'
          : allServicesBooked
          ? 'bg-emerald-50/30 border-emerald-200 shadow-sm'
          : hasExistingBookings
          ? 'bg-white border-emerald-300 shadow-sm ring-1 ring-emerald-500/10'
          : isDaySelected
          ? 'bg-white border-slate-300 shadow-sm ring-1 ring-slate-900/5'
          : 'bg-slate-100/70 border-slate-200 opacity-70'
      }`}
    >
      {/* ── Day Column Header (2-Row Responsive Layout — Zero Overflow Clipping) ── */}
      <div
        className={`p-2.5 sm:p-3 border-b flex flex-col gap-1.5 transition-colors ${
          isHoliday
            ? 'bg-slate-100 border-slate-200 text-slate-500'
            : allServicesServed
            ? 'bg-blue-900 text-white border-blue-900'
            : allServicesBooked
            ? 'bg-emerald-800 text-white border-emerald-800'
            : hasExistingBookings
            ? 'bg-emerald-700 text-white border-emerald-700'
            : isDaySelected
            ? isWeekend
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-slate-900 text-white border-slate-900'
            : 'bg-slate-200/80 text-slate-600 border-slate-200'
        }`}
      >
        {/* Row 1: Day Name, Weekend Chip & Display Date */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-black uppercase tracking-wider truncate leading-tight">
              {dayName}
            </span>
            {isWeekend && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                Weekend
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold opacity-80 shrink-0">
            {displayDate}
          </span>
        </div>

        {/* Row 2: Status Pill or Full-Width Day Active Toggle */}
        {!isHoliday ? (
          <div className="pt-0.5">
            {allServicesServed ? (
              <div className="w-full py-0.5 rounded-md text-[10px] font-bold bg-blue-600/90 text-white flex items-center justify-center gap-1 shadow-2xs">
                <CheckCircleIcon className="w-3 h-3 stroke-[2.5]" />
                <span>Served</span>
              </div>
            ) : allServicesBooked ? (
              <div className="w-full py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white flex items-center justify-center gap-1 shadow-2xs">
                <CheckIcon className="w-3 h-3 stroke-[3]" />
                <span>Booked</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onToggleDay(dateStr)}
                className={`w-full py-1 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs ${
                  isDaySelected
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-slate-300 hover:bg-slate-400/80 text-slate-700'
                }`}
                title={
                  isDaySelected
                    ? 'Click to skip this day from weekly pass'
                    : 'Click to include this day in weekly pass'
                }
              >
                {isDaySelected ? (
                  <>
                    <CheckIcon className="w-3 h-3 stroke-[3]" />
                    <span>Included</span>
                  </>
                ) : (
                  <span>Skipped</span>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-[9px] font-extrabold bg-slate-200 text-slate-600 py-0.5 rounded text-center">
            🏖️ Holiday
          </div>
        )}
      </div>

      {/* Day Column Body */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col space-y-3">
        {isHoliday ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto min-h-[140px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <span className="text-3xl mb-1.5">🏖️</span>
            <span className="text-xs font-bold text-slate-700">
              Public Holiday
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 max-w-[120px] leading-tight">
              {holidayName || 'Canteen Closed'}
            </span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto min-h-[140px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            {isWeekend ? (
              <>
                <span className="text-2xl mb-1.5">☕</span>
                <span className="text-xs font-bold text-slate-600">Weekend Break</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  No meal service scheduled
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl mb-1.5">
                  {getServiceEmoji(activeServiceName)}
                </span>
                <span className="text-xs font-bold text-slate-600 leading-tight">
                  No {activeServiceName}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Not offered this day
                </span>
              </>
            )}
          </div>
        ) : !hasExistingBookings && !isDaySelected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto min-h-[140px] border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
            <span className="text-xs font-bold text-slate-500">Day Skipped</span>
            <span className="text-[10px] text-slate-400 mt-1 max-w-[120px]">
              Toggle button above to include
            </span>
          </div>
        ) : (
          filteredServices.map((srv) => {
            const existingBooking = srv.existingBooking;
            const isServed = existingBooking?.STATUSCODE === 'SRV';
            const allItems = srv.items || [];
            const baseItems = allItems.filter((i) => i.ISBASE === 1);
            const extraItems = allItems.filter((i) => i.ISBASE !== 1);

            return (
              <div key={srv.serviceId} className="space-y-2">
                {/* Service Name Header */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span>{getServiceEmoji(srv.servName)}</span>
                    <span>{srv.servName}</span>
                  </span>

                  {existingBooking && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        isServed
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      #{existingBooking.BOOKNO}
                    </span>
                  )}
                </div>

                {existingBooking ? (
                  <div
                    className={`rounded-xl border p-3 space-y-2.5 ${
                      isServed
                        ? 'border-blue-200 bg-blue-50/70'
                        : 'border-emerald-200 bg-emerald-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold ${
                          isServed ? 'text-blue-950' : 'text-emerald-950'
                        }`}
                      >
                        {isServed ? 'Meal Served' : 'Active Reservation'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {existingBooking.TOTALITEMS} {existingBooking.TOTALITEMS === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-500">Portions:</span>
                        <span className="font-semibold text-slate-800">
                          {existingBooking.TOTALQTY} qty total
                        </span>
                      </div>
                      <div
                        className={`flex justify-between items-baseline border-t pt-1 font-bold ${
                          isServed
                            ? 'border-blue-200/60'
                            : 'border-emerald-200/60'
                        }`}
                      >
                        <span className="text-slate-600">Total Billed:</span>
                        <span
                          className={`font-mono font-black text-xs ${
                            isServed ? 'text-blue-900' : 'text-emerald-900'
                          }`}
                        >
                          ₹{existingBooking.TOTALAMOUNT}
                        </span>
                      </div>
                    </div>

                    {/* Booking Actions: Edit & Cancel */}
                    <div className="pt-0.5">
                      {isServed ? (
                        <div className="w-full py-1.5 bg-blue-100/80 text-blue-800 text-[11px] font-bold rounded-lg border border-blue-200/80 flex items-center justify-center gap-1.5 shadow-2xs">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>Meal Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {onEditMealClick && (
                            <button
                              type="button"
                              onClick={() =>
                                onEditMealClick({
                                  bookingId: existingBooking.BOOKID,
                                  bookingNo: existingBooking.BOOKNO,
                                  serviceId: srv.serviceId,
                                  servName: srv.servName,
                                  dateStr,
                                  displayDate,
                                  availableItems: srv.items || [],
                                })
                              }
                              className="flex-1 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300 hover:border-emerald-400 transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                              title="Edit dishes and portions in this booking"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Edit</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              onCancelMealClick({
                                bookingId: existingBooking.BOOKID,
                                servName: srv.servName,
                                dateStr,
                              })
                            }
                            disabled={cancellingBookingId === existingBooking.BOOKID}
                            className={`py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-[11px] font-bold rounded-lg border border-rose-200 hover:border-rose-300 transition-colors shadow-2xs flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer ${
                              onEditMealClick ? '' : 'w-full'
                            }`}
                            title="Cancel this meal reservation"
                          >
                            {cancellingBookingId === existingBooking.BOOKID ? (
                              <span>...</span>
                            ) : (
                              <>
                                <XCircleIcon className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Base Meals */}
                    {baseItems.map((item) => (
                      <MealItemRow
                        key={item.DAYMENUID}
                        item={item}
                        qty={daySelect?.quantities?.[item.DAYMENUID] || 0}
                        dateStr={dateStr}
                        onToggleItem={onToggleItem}
                        onUpdateQty={onUpdateQty}
                      />
                    ))}

                    {/* Extras */}
                    {extraItems.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                          Extras &amp; Add-ons
                        </span>
                        <div className="space-y-1.5">
                          {extraItems.map((item) => (
                            <MealItemRow
                              key={item.DAYMENUID}
                              item={item}
                              qty={daySelect?.quantities?.[item.DAYMENUID] || 0}
                              dateStr={dateStr}
                              onToggleItem={onToggleItem}
                              onUpdateQty={onUpdateQty}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
