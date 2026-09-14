import React, { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
  CheckIcon,
  SparklesIcon,
  CurrencyRupeeIcon,
} from "@heroicons/react/24/outline";

export function ComboItemPicker({
  availableItems = [],
  loadingItems = false,
  selectedItems = [],
  onAddItem,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL"); // 'ALL' | 'OFFICIAL' | category name

  // Extract unique categories from available items
  const categories = useMemo(() => {
    const cats = new Set();
    availableItems.forEach((item) => {
      const cat = item.SERVNAME || item.CATCODE;
      if (cat && cat !== "Item") {
        cats.add(cat);
      }
    });
    return Array.from(cats).sort();
  }, [availableItems]);

  // Filter items by search term and selected category pill
  const filteredItems = useMemo(() => {
    return availableItems.filter((item) => {
      const name = (item.ITEMNAME || item.MENUNAME || item.SHORTNAME || "").toLowerCase();
      const code = (item.MENUCODE || "").toLowerCase();
      const cat = (item.SERVNAME || item.CATCODE || "").toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch = !search || name.includes(search) || code.includes(search) || cat.includes(search);
      if (!matchesSearch) return false;

      if (activeCategory === "OFFICIAL") {
        return item.OFFSER === 1;
      }
      if (activeCategory !== "ALL") {
        const itemCat = item.SERVNAME || item.CATCODE;
        return itemCat === activeCategory;
      }
      return true;
    });
  }, [availableItems, searchTerm, activeCategory]);

  // Counts for filter pills
  const officialCount = useMemo(() => {
    return availableItems.filter((i) => i.OFFSER === 1).length;
  }, [availableItems]);

  // Map of selected item IDs for fast O(1) lookup
  const selectedMap = useMemo(() => {
    const map = new Map();
    selectedItems.forEach((it) => {
      map.set(Number(it.MENUITEMID), it.QTY);
    });
    return map;
  }, [selectedItems]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-grotesk flex items-center gap-2">
            <span>Menu Items Catalog</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {availableItems.length} items
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click "+ Add" to bundle dishes into this combo package.
          </p>
        </div>
      </div>

      {/* Real-Time Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search dishes by name or meal category (e.g. Rice, Samosa, Tea)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory("ALL")}
          className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-colors cursor-pointer ${
            activeCategory === "ALL"
              ? "bg-orange-500 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          All ({availableItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("OFFICIAL")}
          className={`inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded-full transition-colors cursor-pointer ${
            activeCategory === "OFFICIAL"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
          }`}
        >
          <SparklesIcon className="w-3 h-3 text-emerald-500" />
          Official Eligible ({officialCount})
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-colors cursor-pointer ${
              activeCategory === cat
                ? "bg-orange-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scrollable Catalog Shelf */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40 flex-1">
        <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loadingItems ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading menu catalog items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              {availableItems.length === 0
                ? "No active menu items available in this canteen."
                : "No menu items match your search or filter."}
            </div>
          ) : (
            filteredItems.map((item) => {
              const itemId = Number(item.MENUITEMID);
              const isAdded = selectedMap.has(itemId);
              const displayName = item.ITEMNAME || item.MENUNAME || item.SHORTNAME;
              const categoryTag = item.SERVNAME || item.CATCODE;
              const price = Number(item.UNITPRICE || item.OFFPRICE || 0);

              return (
                <div
                  key={itemId}
                  className={`px-4 py-3 flex items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-800/80 transition-colors ${
                    isAdded ? "bg-emerald-500/5 dark:bg-emerald-950/10" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </span>
                      {item.OFFSER === 1 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          ⭐ Official
                        </span>
                      )}
                      {categoryTag && categoryTag !== "Item" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {categoryTag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      {item.MENUCODE && (
                        <span className="font-mono text-[10px] text-slate-400">
                          {item.MENUCODE}
                        </span>
                      )}
                      {item.SHORTNAME && item.SHORTNAME !== item.ITEMNAME && (
                        <span>• {item.SHORTNAME}</span>
                      )}
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900 dark:text-white font-mono">
                        ₹{price.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        unit rate
                      </span>
                    </div>

                    <div>
                      {isAdded ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          <CheckIcon className="w-3.5 h-3.5" />
                          Added ({selectedMap.get(itemId)})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddItem(item)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ComboItemPicker;
