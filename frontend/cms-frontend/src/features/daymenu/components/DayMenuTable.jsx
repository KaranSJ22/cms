import React from "react";

export default function DayMenuTable({ dayMenus }) {
  if (!dayMenus || dayMenus.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-1">Menu is Empty</h3>
        <p className="text-sm max-w-sm text-slate-500">
          This day slot has no items planned yet. Use the catalog on the left to add items to this menu.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Current Day Menu</h3>
        <span className="text-xs font-medium bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600">
          {dayMenus.length} Items
        </span>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-5 font-semibold bg-white">Item Name</th>
              <th className="py-3 px-4 font-semibold text-center bg-white">Qty</th>
              <th className="py-3 px-4 font-semibold text-center bg-white">Config</th>
              <th className="py-3 px-4 font-semibold text-center bg-white">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {dayMenus.map((menu) => (
              <tr
                key={menu.DAYMENUID}
                className="hover:bg-slate-50/70 transition-colors"
              >
                <td className="py-3 px-5">
                  <div className="font-medium text-slate-900">{menu.ITEMNAME}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{menu.MENUCODE}</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="font-medium">{menu.MAXQTY}</div>
                  <div className="text-xs text-slate-400">Total</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1 items-center">
                    {menu.ISPREBOOK === "Y" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        PRE-BOOK
                      </span>
                    )}
                    {menu.ISKIOSK === "Y" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100">
                        KIOSK
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${
                      menu.APPRSTATUS === "APP"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : menu.APPRSTATUS === "REJ"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {menu.APPRSTATUS === "APP"
                      ? "Approved"
                      : menu.APPRSTATUS === "REJ"
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
