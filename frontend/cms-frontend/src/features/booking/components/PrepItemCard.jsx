import React from "react";

export default function PrepItemCard({ item }) {
  const { ITEMNAME, SHORTNAME, TOTAL_BOOKED, TOTAL_SERVED, REMAINING_QTY } = item;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      {/* Top Header - Space Blue Text */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xl font-bold text-[#0B3D91] leading-tight line-clamp-2">
          {ITEMNAME}
        </h3>
        {SHORTNAME && (
          <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">
            {SHORTNAME}
          </p>
        )}
      </div>

      {/* Main Metric - Total Booked */}
      <div className="p-6 flex flex-col items-center justify-center flex-1">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">
          Total Ordered
        </span>
        <span className="text-6xl font-black text-slate-800 tracking-tighter">
          {TOTAL_BOOKED}
        </span>
      </div>

      {/* Bottom Metrics - Pill Indicators */}
      <div className="bg-slate-50 p-4 grid grid-cols-2 gap-3 border-t border-slate-100 mt-auto">
        
        {/* Served Indicator - Emerald */}
        <div className="flex flex-col bg-emerald-50 rounded-xl p-3 border border-emerald-100/50 items-center text-center">
          <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-1">
            Served
          </span>
          <span className="text-2xl font-extrabold text-emerald-600">
            {TOTAL_SERVED}
          </span>
        </div>

        {/* Remaining Indicator - Saffron */}
        <div className="flex flex-col bg-[#F4C430]/10 rounded-xl p-3 border border-[#F4C430]/20 items-center text-center">
          <span className="text-xs font-bold text-[#F4C430] uppercase tracking-wider mb-1 opacity-80">
            Remaining
          </span>
          <span className="text-2xl font-extrabold text-orange-500">
            {REMAINING_QTY}
          </span>
        </div>

      </div>
    </div>
  );
}
