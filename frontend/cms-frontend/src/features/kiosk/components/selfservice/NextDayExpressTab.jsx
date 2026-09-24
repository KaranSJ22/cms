import { ArrowPathIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";

export default function NextDayExpressTab({
  nextDayMenu,
  menuLoading,
  loadNextDayMenu,
  selectedItems,
  handleQuantityChange,
  handleConfirmBooking,
  bookingLoading,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h3 className="text-base font-bold text-white font-grotesk">
            Tomorrow's Canteen Menu ({nextDayMenu?.targetDate})
          </h3>
          <p className="text-xs text-slate-400">
            Self-service kiosk pre-booking is open for tomorrow. Select meal
            portions and confirm.
          </p>
        </div>
        <button
          type="button"
          onClick={loadNextDayMenu}
          disabled={menuLoading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
        >
          <ArrowPathIcon
            className={`w-5 h-5 ${menuLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {menuLoading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading tomorrow's published menus...
        </div>
      ) : !nextDayMenu || nextDayMenu.services?.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <p className="text-lg font-bold text-slate-300">
            No menu published for tomorrow yet.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Please check back later once the canteen manager publishes tomorrow's
            schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {nextDayMenu.services.map((service) => {
            const serviceItemsSelected = service.items.filter(
              (i) => (selectedItems[i.dayMenuId] || 0) > 0
            );
            const totalServiceAmt = serviceItemsSelected.reduce(
              (sum, i) => sum + i.rate * (selectedItems[i.dayMenuId] || 0),
              0
            );

            return (
              <div
                key={service.serviceId}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5"
              >
                {/* Service Header */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-xl font-bold text-white font-grotesk">
                      {service.serviceName}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      Service window: {service.startTime?.slice(0, 5)} -{" "}
                      {service.endTime?.slice(0, 5)}
                    </span>
                  </div>
                  {serviceItemsSelected.length > 0 && (
                    <div className="text-right">
                      <span className="text-xs text-orange-400 font-bold block">
                        Subtotal: {formatINR(totalServiceAmt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dish Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {service.items.map((item) => {
                    const qty = selectedItems[item.dayMenuId] || 0;
                    return (
                      <div
                        key={item.dayMenuId}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          qty > 0
                            ? "bg-slate-800/80 border-orange-500/60"
                            : "bg-slate-950 border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-base font-black text-white font-mono ml-auto">
                              {formatINR(item.rate)}
                            </span>
                          </div>
                          <h5 className="text-base font-bold text-white mt-1">
                            {item.itemName}
                          </h5>
                          {item.itemDesc && (
                            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                              {item.itemDesc}
                            </p>
                          )}
                        </div>

                        {/* Touch Quantity Stepper */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-xs text-slate-400">Qty:</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={qty === 0}
                              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center text-lg font-black text-white font-mono">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item, 1)}
                              className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Confirm Booking Bar for this Service */}
                {serviceItemsSelected.length > 0 && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleConfirmBooking(service)}
                      disabled={bookingLoading}
                      className="px-8 py-3.5 rounded-2xl font-black text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {bookingLoading
                        ? "Confirming..."
                        : `CONFIRM ${service.serviceName.toUpperCase()} (${formatINR(
                            totalServiceAmt
                          )})`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
