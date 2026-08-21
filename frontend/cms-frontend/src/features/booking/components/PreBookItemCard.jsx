import React from "react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

export default function PreBookItemCard({ item, cartItem, onAdd, onRemove }) {
  const quantityInCart = cartItem?.qty || 0;
  const availableLimit = Math.min(item.AVAILQTY, item.MAXQTY);
  const isSoldOut = item.AVAILQTY <= 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden flex flex-col h-full ${isSoldOut ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{item.ITEMNAME}</h3>
            {item.SHORTNAME && (
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full mb-2">
                {item.SHORTNAME}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="block text-xl font-bold text-[#0F172A]">₹{item.DISPLAYPRICE}</span>
          </div>
        </div>
        
        {item.ITEMDESCR && (
          <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">
            {item.ITEMDESCR}
          </p>
        )}
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-sm">
            {isSoldOut ? (
              <span className="text-red-500 font-semibold">Sold Out</span>
            ) : (
              <span className="text-slate-500">
                <span className="font-medium text-slate-700">{item.AVAILQTY}</span> available
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {!isSoldOut && quantityInCart === 0 ? (
              <button
                onClick={() => onAdd(item)}
                className="px-4 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add
              </button>
            ) : !isSoldOut ? (
              <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                <button
                  onClick={() => onRemove(item)}
                  className="p-1.5 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-l-lg transition-colors"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium text-slate-900 text-sm">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onAdd(item)}
                  disabled={quantityInCart >= availableLimit}
                  className="p-1.5 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-r-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
