import React, { useState } from "react";
import { TrashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function CartSummaryPanel({ cart, totalAmount, totalItems, onConfirm, isSubmitting }) {
  if (totalItems === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center h-full flex flex-col justify-center sticky top-6">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Your cart is empty</h3>
        <p className="text-slate-500 text-sm">Add items from the menu to start booking.</p>
      </div>
    );
  }

  // Group cart items by SERVICEID
  const groupedCart = Object.values(cart).reduce((acc, item) => {
    if (!acc[item.SERVICEID]) {
      acc[item.SERVICEID] = {
        SERVNAME: item.SERVNAME,
        items: []
      };
    }
    acc[item.SERVICEID].items.push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[calc(100vh-2rem)] sticky top-4 max-h-[800px]">
      <div className="p-5 border-b border-slate-100 bg-[#0F172A] rounded-t-xl text-white">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>Booking Summary</span>
          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            {totalItems} items
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {Object.entries(groupedCart).map(([serviceId, group]) => (
          <div key={serviceId} className="mb-6 last:mb-0">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
              {group.SERVNAME}
            </h3>
            <ul className="space-y-4">
              {group.items.map((item) => (
                <li key={item.DAYMENUID} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{item.ITEMNAME}</p>
                    <p className="text-slate-500 text-xs mt-0.5">₹{item.DISPLAYPRICE} x {item.qty}</p>
                  </div>
                  <div className="font-bold text-slate-900 ml-4">
                    ₹{item.qty * item.DISPLAYPRICE}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-5 bg-slate-50 rounded-b-xl border-t border-slate-200">
        <div className="flex justify-between items-center mb-5">
          <span className="text-slate-600 font-medium">Total Amount</span>
          <span className="text-2xl font-bold text-[#0F172A]">₹{totalAmount}</span>
        </div>
        
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-[#F4C430] hover:bg-[#e0b42c] text-[#0F172A] font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              Confirm Booking
            </>
          )}
        </button>
        <p className="text-xs text-center text-slate-500 mt-3">
          Bookings are subject to cutoff times.
        </p>
      </div>
    </div>
  );
}
