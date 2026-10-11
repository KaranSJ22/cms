import { formatINR } from "../utils/formatters";

export default function NextDayExpressTab({
  targetDate,
  availableServices = [],
  servicesLoading,
  selectedService,
  serviceMenu,
  menuLoading,
  handleSelectService,
  handleBackToServices,
  selectedItems,
  handleQuantityChange,
  handleConfirmBooking,
  bookingLoading,
  isServiceBooked,
}) {
  // ────────────────────────────────────────────────────────────
  // STEP 2: Dish Selection View
  // ────────────────────────────────────────────────────────────
  if (selectedService) {
    const items = serviceMenu?.items || [];
    const selectedList = items.filter((i) => (selectedItems[i.dayMenuId] || 0) > 0);
    const totalQty = selectedList.reduce((sum, i) => sum + (selectedItems[i.dayMenuId] || 0), 0);
    const totalAmt = selectedList.reduce(
      (sum, i) => sum + i.rate * (selectedItems[i.dayMenuId] || 0),
      0
    );

    return (
      <div className="space-y-4 max-w-2xl mx-auto w-full pb-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
          <button
            type="button"
            onClick={handleBackToServices}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95 border border-slate-700"
          >
            ← Back to Services
          </button>
          <div className="text-right">
            <span className="text-xs font-bold text-white block">{selectedService.serviceName}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {selectedService.startTime} - {selectedService.endTime}
            </span>
          </div>
        </div>

        {/* Dishes List */}
        {menuLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading dishes...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-slate-900 rounded-2xl border border-slate-800">
            No dishes published for this meal service yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {items.map((item) => {
              const qty = selectedItems[item.dayMenuId] || 0;
              return (
                <div
                  key={item.dayMenuId}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    qty > 0
                      ? "bg-slate-900 border-emerald-500/50 shadow-md"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex-1 mr-3">
                    <h4 className="text-sm font-bold text-white mb-0.5">{item.itemName}</h4>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatINR(item.rate)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.dayMenuId, -1)}
                      disabled={qty === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-all"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-sm text-white">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.dayMenuId, 1)}
                      disabled={qty >= (item.maxQty || 2)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-all shadow"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Bottom Action Bar */}
        <div className="sticky bottom-2 bg-slate-900/95 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 block">Total ({totalQty} items)</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {formatINR(totalAmt)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={totalQty === 0 || bookingLoading}
            className="flex-1 max-w-xs py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-sm transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/20 disabled:shadow-none disabled:cursor-not-allowed text-center"
          >
            {bookingLoading ? "Recording..." : "Confirm & Book"}
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // STEP 1: Service Selection (Breakfast / Lunch / Dinner)
  // ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full">
      <div className="text-center mb-2">
        <h3 className="text-base font-bold text-white mb-0.5">Pre-Book Meals for Tomorrow</h3>
        <p className="text-xs text-slate-400">
          Target Date: <span className="font-semibold text-emerald-400 font-mono">{targetDate}</span>
        </p>
      </div>

      {servicesLoading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading published services...</div>
      ) : availableServices.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm bg-slate-900 rounded-2xl border border-slate-800">
          No meal services published for tomorrow yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableServices.map((svc) => {
            const alreadyBooked = isServiceBooked(svc.serviceId);
            return (
              <button
                key={svc.serviceId}
                type="button"
                onClick={() => !alreadyBooked && handleSelectService(svc)}
                disabled={alreadyBooked}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  alreadyBooked
                    ? "bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-500/50 active:scale-98 shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{svc.serviceName}</span>
                    {alreadyBooked && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                        Already Booked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-3">
                    ⏰ {svc.startTime} - {svc.endTime}
                  </p>
                </div>

                <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>{svc.totalItems || 0} Dishes Available</span>
                  <span>Select →</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
