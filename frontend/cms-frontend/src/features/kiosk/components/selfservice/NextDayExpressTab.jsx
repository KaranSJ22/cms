import {
  ArrowPathIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
  SparklesIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";

export default function NextDayExpressTab({
  targetDate,
  availableServices = [],
  servicesLoading,
  loadNextDayServices,
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
  getServiceBooking,
  setActiveTab,
  editingBooking,
  handleStartEditBooking,
}) {
  // ────────────────────────────────────────────────────────────
  // STEP 2: Dish Selection View for a Specific Service
  // ────────────────────────────────────────────────────────────
  if (selectedService) {
    const items = serviceMenu?.items || [];
    const selectedList = items.filter(
      (i) => (selectedItems[i.dayMenuId] || 0) > 0
    );
    const totalQty = selectedList.reduce(
      (sum, i) => sum + (selectedItems[i.dayMenuId] || 0),
      0
    );
    const totalAmt = selectedList.reduce(
      (sum, i) => sum + i.rate * (selectedItems[i.dayMenuId] || 0),
      0
    );

    return (
      <div className="space-y-3 pb-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-md">
          <button
            type="button"
            onClick={handleBackToServices}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95 border border-slate-700"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>All Services</span>
          </button>

          <div className="text-center">
            <h3 className="text-sm font-black text-white font-grotesk flex items-center justify-center gap-1.5">
              <span>{selectedService.serviceName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">
                {targetDate}
              </span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Window: {selectedService.startTime?.slice(0, 5)} -{" "}
              {selectedService.endTime?.slice(0, 5)}
            </span>
          </div>

          <div className="w-20 text-right">
            {totalQty > 0 && (
              <span className="text-[11px] font-mono font-bold text-orange-400">
                {totalQty} item{totalQty > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Edit Mode Alert Banner */}
        {editingBooking && (
          <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <PencilSquareIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Modifying order <strong className="font-mono text-white">#{editingBooking.BOOKNO}</strong> before cutoff
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Edit Mode
            </span>
          </div>
        )}

        {/* Loading Spinner */}
        {menuLoading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading {selectedService.serviceName} menu...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <p className="text-sm font-bold text-slate-300">
              No kiosk items published for {selectedService.serviceName}.
            </p>
            <button
              type="button"
              onClick={handleBackToServices}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              ← Choose Another Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {items.map((item) => {
              const qty = selectedItems[item.dayMenuId] || 0;
              return (
                <div
                  key={item.dayMenuId}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 shadow-sm ${
                    qty > 0
                      ? "bg-slate-800/90 border-orange-500/80 shadow-orange-500/10"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs md:text-sm font-bold text-white truncate">
                        {item.itemName}
                      </h4>
                      {item.itemDesc && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.itemDesc}
                        </p>
                      )}
                    </div>
                    <span className="text-xs md:text-sm font-black text-white font-mono shrink-0">
                      {formatINR(item.rate)}
                    </span>
                  </div>

                  {/* Touch Stepper */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {qty > 0 ? formatINR(item.rate * qty) : "Portion"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer active:scale-95 border border-slate-700"
                      >
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-black text-white font-mono">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item, 1)}
                        className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer active:scale-95 shadow-sm"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky Confirm Bar */}
        {selectedList.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-lg sticky bottom-2 z-10">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                {selectedService.serviceName} Subtotal
              </span>
              <p className="text-base font-black text-white font-mono leading-tight">
                {formatINR(totalAmt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleConfirmBooking(serviceMenu || selectedService)}
              disabled={bookingLoading}
              className={`px-6 py-2.5 rounded-xl font-black text-xs md:text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 ${
                editingBooking
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              {bookingLoading
                ? "Updating..."
                : editingBooking
                ? `UPDATE ${selectedService.serviceName.toUpperCase()} (${formatINR(
                    totalAmt
                  )})`
                : `CONFIRM ${selectedService.serviceName.toUpperCase()} (${formatINR(
                    totalAmt
                  )})`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // STEP 1: Available Meal Services Overview
  // ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Meal Services ({targetDate || "Tomorrow"})
          </h3>
          <p className="text-[10px] text-slate-500">
            Select a service to view dishes and reserve your meal
          </p>
        </div>
        <button
          type="button"
          onClick={loadNextDayServices}
          disabled={servicesLoading}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95"
          title="Refresh Services"
        >
          <ArrowPathIcon
            className={`w-4 h-4 ${servicesLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {servicesLoading ? (
        <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Checking tomorrow's canteen schedule...</p>
        </div>
      ) : availableServices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
          <SparklesIcon className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">
            No meal services published for tomorrow yet.
          </p>
          <p className="text-xs text-slate-500">
            Please check back once the canteen manager publishes tomorrow's menu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {availableServices.map((service) => {
            const booked = isServiceBooked(service.serviceId);
            const booking = getServiceBooking(service.serviceId);

            return (
              <div
                key={service.serviceId}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 shadow-md ${
                  booked
                    ? "bg-emerald-950/30 border-emerald-700/60"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {service.serviceCode || `SERV-${service.serviceId}`}
                    </span>
                    {booked ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" />
                        <span>Booked</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {service.totalItems} dish{service.totalItems > 1 ? "es" : ""}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white mt-1 font-grotesk">
                    {service.serviceName}
                  </h4>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
                    <ClockIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      {service.startTime?.slice(0, 5)} - {service.endTime?.slice(0, 5)}
                    </span>
                  </div>
                </div>

                {booked ? (
                  <div className="pt-2 border-t border-emerald-800/40 space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-emerald-300 font-mono">
                      <span>Order: <strong className="text-white">{booking?.BOOKNO}</strong></span>
                      <span>{booking?.TOTALITEMS || 1} item(s)</span>
                    </div>
                    <div className="flex gap-2">
                      {handleStartEditBooking && booking && (
                        <button
                          type="button"
                          onClick={() => handleStartEditBooking(booking)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>Edit Meal</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab?.("bookings")}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer active:scale-95"
                        title="View details"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleSelectService(service)}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition-all cursor-pointer active:scale-95 shadow-sm font-grotesk flex items-center justify-center gap-1"
                    >
                      <span>Select Dishes</span>
                      <span>→</span>
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
