import React, { useState, useEffect, useMemo } from "react";
import { getMenuItems } from "../../menu/api/menuApi";

export default function SingleDayBuilder({
  resolvedSlot,
  onSaveSelection,
  isSubmitting,
}) {
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // selectionState format: { [MENUITEMID]: { selected: boolean, MAXQTY: number, ISPREBOOK: boolean, ISKIOSK: boolean } }
  const [selectionState, setSelectionState] = useState({});

  useEffect(() => {
    async function loadCatalog() {
      try {
        const catalogData = await getMenuItems({ status: "A" });
        const catalog = catalogData || [];
        setMenuCatalog(catalog);
        
        // Initialize selection state
        const initialSelections = {};
        catalog.forEach(item => {
          initialSelections[item.MENUITEMID] = {
            selected: false,
            MAXQTY: 100,
            ISPREBOOK: true,
            ISKIOSK: true
          };
        });
        setSelectionState(initialSelections);
      } catch (err) {
        console.error("Failed to load catalog", err);
      }
    }
    loadCatalog();
  }, []);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return menuCatalog;
    const query = searchQuery.toLowerCase();
    return menuCatalog.filter(
      item => 
        item.ITEMNAME.toLowerCase().includes(query) || 
        item.MENUCODE.toLowerCase().includes(query) ||
        item.SHORTNAME.toLowerCase().includes(query)
    );
  }, [menuCatalog, searchQuery]);

  const toggleItem = (itemId) => {
    setSelectionState(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: !prev[itemId].selected }
    }));
  };

  const updateItemField = (itemId, field, value) => {
    setSelectionState(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handleSave = () => {
    if (!resolvedSlot) return;
    
    const slotDateStr = resolvedSlot.SERVDATE.substring(0, 10);
    const startHour = resolvedSlot.STARTTIME ? resolvedSlot.STARTTIME.substring(0, 5) : "00:00";
    const bookingDeadline = new Date(`${slotDateStr}T${startHour}:00`).toISOString();

    const itemsToSave = Object.keys(selectionState)
      .filter(id => selectionState[id].selected)
      .map(id => ({
        DAYSLOTID: resolvedSlot.DAYSLOTID,
        MENUITEMID: Number(id),
        AVAILQTY: selectionState[id].MAXQTY,
        MAXQTY: selectionState[id].MAXQTY,
        ISPREBOOK: selectionState[id].ISPREBOOK ? 1 : 0,
        ISKIOSK: selectionState[id].ISKIOSK ? 1 : 0,
        BOOKUNTIL: bookingDeadline,
        CANCELUNTIL: bookingDeadline,
      }));
      
    onSaveSelection(itemsToSave);
  };

  const getSelectedCount = () => {
    return Object.values(selectionState).filter(s => s.selected).length;
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 transition-opacity duration-300 ${resolvedSlot ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
      
      {/* Header & Search Bar */}
      <div className="p-5 border-b border-slate-100 bg-white rounded-t-xl z-10 sticky top-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Step 2: Build Menu</h2>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {getSelectedCount()} Items Selected
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search catalog by item name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>

      {/* Single Column Catalog List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-slate-50/30">
        {filteredCatalog.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No items matched your search.
          </div>
        ) : (
          filteredCatalog.map((item) => {
            const state = selectionState[item.MENUITEMID];
            if (!state) return null;

            return (
              <div
                key={item.MENUITEMID}
                className={`p-4 rounded-xl border transition-all ${
                  state.selected 
                    ? "border-orange-500 bg-orange-50/40 shadow-sm" 
                    : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 text-base">{item.ITEMNAME}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.SHORTNAME} • {item.MENUCODE}</p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => toggleItem(item.MENUITEMID)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      state.selected ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        state.selected ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Inline Options for Selected Items */}
                {state.selected && (
                  <div className="mt-4 pt-4 border-t border-orange-100/60 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Max Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={state.MAXQTY}
                        onChange={(e) => updateItemField(item.MENUITEMID, 'MAXQTY', Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="flex items-end pb-1.5 sm:col-span-2">
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group bg-white px-3 py-1.5 rounded-md border border-slate-200 hover:border-orange-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={state.ISPREBOOK}
                            onChange={(e) => updateItemField(item.MENUITEMID, 'ISPREBOOK', e.target.checked)}
                            className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Pre-Book</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group bg-white px-3 py-1.5 rounded-md border border-slate-200 hover:border-orange-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={state.ISKIOSK}
                            onChange={(e) => updateItemField(item.MENUITEMID, 'ISKIOSK', e.target.checked)}
                            className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Kiosk</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Save Footer */}
      <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl z-10 sticky bottom-0">
        <button
          onClick={handleSave}
          disabled={!resolvedSlot || getSelectedCount() === 0 || isSubmitting}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-base"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving to Menu...
            </>
          ) : (
            `Add ${getSelectedCount()} Items to Menu`
          )}
        </button>
      </div>
    </div>
  );
}
