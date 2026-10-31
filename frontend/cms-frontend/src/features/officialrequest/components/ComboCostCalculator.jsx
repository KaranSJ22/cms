import React from "react";
import {
  CurrencyRupeeIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export function ComboCostCalculator({
  grossTotal = 0,
  handlingCharge = 0,
  onHandlingChange,
}) {
  const safeGross = Number(grossTotal) || 0;
  const safeHandling = Number(handlingCharge) || 0;
  const totalRate = safeGross + safeHandling;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <CurrencyRupeeIcon className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-grotesk">
              Costing &amp; Price Breakdown
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Live calculation of food portion cost and delivery/handling overhead
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* 1. Gross Food Rate (Derived from items) */}
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
            Gross Food Rate (Items Total)
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
            ₹{safeGross.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">
            Auto-calculated from selected items (billed per attendee)
          </span>
        </div>

        {/* 2. Flat Handling / Service Overhead */}
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
            Flat Handling &amp; Service Fee (₹)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              step="0.5"
              min="0"
              placeholder="0.00"
              value={handlingCharge === 0 ? "" : handlingCharge}
              onChange={(e) => onHandlingChange(e.target.value)}
              className="w-full pl-6 pr-2 py-1 text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>
          <span className="text-[10px] text-slate-400">
            One-time flat delivery &amp; setup fee per booking
          </span>
        </div>
      </div>

      {/* Pricing Formula Explanation Banner */}
      <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
        <InformationCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-bold">Official Booking Calculation Rule:</span> Total Amount ={" "}
          <span className="font-mono font-semibold">(Quantity × Gross Food Rate) + Flat Handling Fee</span>.
          The handling charge is added once per booking, not multiplied per person.
        </div>
      </div>

      {/* Package Rate Summary Card */}
      <div className="p-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/80 dark:border-orange-900/40 rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
            Package Unit Food Rate:
          </span>
          <span className="text-base font-black text-orange-600 dark:text-orange-400 font-mono">
            ₹{safeGross.toFixed(2)}{" "}
            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
              / package
            </span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 mt-1.5 border-t border-orange-200/60 dark:border-orange-800/40 flex justify-between items-center">
          <span>
            {safeGross > 0 ? (
              <>
                Package Rate: <strong className="text-slate-700 dark:text-slate-300">₹{safeGross.toFixed(2)}/pkg</strong>
                {safeHandling > 0 && (
                  <> + Flat Handling: <strong className="text-slate-700 dark:text-slate-300">₹{safeHandling.toFixed(2)} on total booking</strong></>
                )}
              </>
            ) : (
              "Add items to calculate food portion costs"
            )}
          </span>
          {safeGross > 0 && (
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
              Base Combo: ₹{totalRate.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComboCostCalculator;
