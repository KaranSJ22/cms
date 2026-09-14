import React from "react";
import {
  CurrencyRupeeIcon,
  SparklesIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export function ComboCostCalculator({
  grossTotal = 0,
  handlingCharge = 0,
  onHandlingChange,
  comboPrice = 0,
  onComboPriceChange,
  onSyncSuggested,
}) {
  const safeGross = Number(grossTotal) || 0;
  const safeHandling = Number(handlingCharge) || 0;
  const suggestedNet = safeGross + safeHandling;
  const safeComboPrice = Number(comboPrice) || 0;
  const markupDiff = safeComboPrice - safeGross;
  const markupPercent = safeGross > 0 ? ((markupDiff / safeGross) * 100).toFixed(1) : 0;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <CurrencyRupeeIcon className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-grotesk">
              Costing & Price Breakdown
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Live calculation of food portion cost and delivery/handling overhead
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSyncSuggested}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800/50 transition-colors cursor-pointer"
          title="Auto-fill Final Combo Price with Suggested Net Total"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Sync Price
        </button>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* 1. Gross Food Total */}
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
            Gross Food Price (Items Total)
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
            ₹{safeGross.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400">
            Sum of individual item catalog rates
          </span>
        </div>

        {/* 2. Handling / Delivery Overhead */}
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
            Handling & Delivery Charge (₹)
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
            Packaging, logistics, service fees
          </span>
        </div>
      </div>

      {/* Suggested Net vs Final Price */}
      <div className="p-3.5 bg-linear-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/80 dark:border-orange-900/40 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Suggested Net Price (Gross + Handling):
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
            ₹{suggestedNet.toFixed(2)}
          </span>
        </div>

        <div className="pt-2 border-t border-orange-200/60 dark:border-orange-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Final Combo Portion Price (₹) <span className="text-rose-500">*</span>
            </label>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Official unit rate billed per portion upon booking
            </p>
          </div>

          <div className="w-full sm:w-44 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              step="0.5"
              min="0"
              placeholder="0.00"
              value={comboPrice === 0 ? "" : comboPrice}
              onChange={(e) => onComboPriceChange(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-base font-black text-right text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
        </div>

        {/* Dynamic Margin Indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <span>
            {safeGross > 0 ? (
              <>
                Food: <strong className="text-slate-700 dark:text-slate-300">₹{safeGross.toFixed(2)}</strong> + Overhead:{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  {markupDiff >= 0 ? `+₹${markupDiff.toFixed(2)}` : `-₹${Math.abs(markupDiff).toFixed(2)}`}
                </strong>
              </>
            ) : (
              "Add items to calculate food portion costs"
            )}
          </span>

          {safeGross > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                markupDiff >= 0
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              }`}
            >
              {markupDiff >= 0 ? `+${markupPercent}% Markup` : `${markupPercent}% Discount`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComboCostCalculator;
