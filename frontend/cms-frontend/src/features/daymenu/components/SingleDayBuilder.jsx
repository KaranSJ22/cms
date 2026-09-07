import { useState, useEffect, useMemo } from "react";
import { getMenuItems } from "../../menu/api/menuApi";
import { checkPriceReadiness } from "../../menu/api/menuApi";

export default function SingleDayBuilder({
  resolvedSlot,
  initialWorkspaceItems = [],
  onSaveSelection,
  onSaveAndPublish,
  isManager = false,
  isSubmitting,
}) {
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // selectionState format: { [MENUITEMID]: { selected: boolean, MAXQTY: number, AVAILQTY: string|number, ISPREBOOK: boolean, ISKIOSK: boolean, ISBASE: boolean, priceStatus: 'idle'|'checking'|'ready'|'error', priceError: string } }
  const [selectionState, setSelectionState] = useState({});

  useEffect(() => {
    async function loadCatalog() {
      try {
        const catalogData = await getMenuItems({ status: "ACT" });
        const catalog = catalogData || [];
        setMenuCatalog(catalog);
        
        // Initialize selection state based on catalog and initialWorkspaceItems
        const initialSelections = {};
        catalog.forEach(item => {
          const workspaceItem = initialWorkspaceItems.find(wi => wi.MENUITEMID === item.MENUITEMID);
          
          if (workspaceItem) {
            initialSelections[item.MENUITEMID] = {
              selected: true,
              MAXQTY: workspaceItem.MAXQTY || 100,
              AVAILQTY: workspaceItem.AVAILQTY === null || workspaceItem.AVAILQTY === undefined ? '' : workspaceItem.AVAILQTY,
              ISPREBOOK: workspaceItem.ISPREBOOK === 1 || workspaceItem.ISPREBOOK === 'Y',
              ISKIOSK: workspaceItem.ISKIOSK === 1 || workspaceItem.ISKIOSK === 'Y',
              ISBASE: workspaceItem.ISBASE === 1,
              priceStatus: 'ready',
              checkingPrice: false,
              priceError: null,
            };
          } else {
            initialSelections[item.MENUITEMID] = {
              selected: false,
              MAXQTY: 100,
              AVAILQTY: '',
              ISPREBOOK: true,
              ISKIOSK: true,
              ISBASE: false,
              priceStatus: 'idle',
              checkingPrice: false,
              priceError: null,
            };
          }
        });
        setSelectionState(initialSelections);
      } catch (err) {
        console.error("Failed to load catalog", err);
      }
    }
    loadCatalog();
  }, [resolvedSlot, initialWorkspaceItems]);

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

  const toggleItem = async (itemId) => {
    if (!resolvedSlot) return;
    const state = selectionState[itemId];
    
    // First time selecting -> check price readiness
    if (!state.selected && state.priceStatus !== 'ready') {
      setSelectionState(prev => ({ ...prev, [itemId]: { ...prev[itemId], checkingPrice: true } }));
      try {
        const slotDateStr = resolvedSlot.SERVDATE.substring(0, 10);
        await checkPriceReadiness(itemId, slotDateStr);
        setSelectionState(prev => ({
          ...prev,
          [itemId]: { 
            ...prev[itemId], 
            priceStatus: 'ready', 
            checkingPrice: false, 
            selected: true, 
            priceError: null 
          }
        }));
      } catch (err) {
        const msg = err.response?.data?.MESSAGE || "Price check failed";
        setSelectionState(prev => ({
          ...prev,
          [itemId]: { 
            ...prev[itemId], 
            priceStatus: 'error', 
            priceError: msg, 
            checkingPrice: false 
          }
        }));
      }
    } else {
      setSelectionState(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], selected: !prev[itemId].selected }
      }));
    }
  };

  const updateItemField = (itemId, field, value) => {
    setSelectionState(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const getItemsToSave = () => {
    if (!resolvedSlot) return [];
    
    const slotDateStr = resolvedSlot.SERVDATE.substring(0, 10);
    const startHour = resolvedSlot.STARTTIME ? resolvedSlot.STARTTIME.substring(0, 5) : "00:00";
    const bookingDeadline = new Date(`${slotDateStr}T${startHour}:00`).toISOString();

    return Object.keys(selectionState)
      .filter(id => selectionState[id].selected)
      .map(id => ({
        MENUITEMID: Number(id),
        AVAILQTY: selectionState[id].AVAILQTY === '' ? null : Number(selectionState[id].AVAILQTY),
        MAXQTY: Number(selectionState[id].MAXQTY),
        ISPREBOOK: selectionState[id].ISPREBOOK ? 1 : 0,
        ISKIOSK: selectionState[id].ISKIOSK ? 1 : 0,
        ISBASE: selectionState[id].ISBASE ? 1 : 0,
        ISSPECIAL: 0,
        BOOKUNTIL: bookingDeadline,
        CANCELUNTIL: bookingDeadline,
      }));
  };

  const handleSave = () => {
    const items = getItemsToSave();
    if (items.length > 0) onSaveSelection(items);
  };

  const handleSaveAndPublishClick = () => {
    const items = getItemsToSave();
    if (items.length > 0 && onSaveAndPublish) onSaveAndPublish(items);
  };

  const selectedItems = Object.values(selectionState).filter(s => s.selected);
  const getSelectedCount = () => selectedItems.length;
  
  const hasBaseItem = selectedItems.some(s => s.ISBASE);
  const allReady = selectedItems.every(s => s.priceStatus === 'ready');
  const canSave = resolvedSlot && getSelectedCount() > 0 && hasBaseItem && allReady && !isSubmitting;

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

        <div className="relative mb-2">
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        
        {getSelectedCount() > 0 && !hasBaseItem && (
          <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
            ⚠️ You must select at least one Base Item to save the menu.
          </div>
        )}
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
                    ? "border-blue-500 bg-blue-50/20 shadow-sm" 
                    : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 text-base flex items-center gap-2">
                      {item.ITEMNAME}
                      {state.selected && state.ISBASE && (
                        <span className="text-[10px] font-bold bg-[#0F172A] text-white px-2 py-0.5 rounded tracking-wide">
                          BASE ITEM
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.SHORTNAME} • {item.MENUCODE}</p>
                    
                    {state.priceStatus === 'error' && (
                      <p className="text-xs text-rose-600 mt-1 font-medium bg-rose-50 inline-block px-2 py-0.5 rounded border border-rose-200">
                        {state.priceError}
                      </p>
                    )}
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3">
                    {state.checkingPrice && (
                      <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    <button
                      type="button"
                      disabled={state.checkingPrice}
                      onClick={() => toggleItem(item.MENUITEMID)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        state.selected ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          state.selected ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Inline Options for Selected Items */}
                {state.selected && (
                  <div className="mt-4 pt-4 border-t border-blue-100/60 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Max Qty / User</label>
                      <input
                        type="number"
                        min="1"
                        value={state.MAXQTY}
                        onChange={(e) => updateItemField(item.MENUITEMID, 'MAXQTY', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Avail Qty (Opt)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        value={state.AVAILQTY}
                        onChange={(e) => updateItemField(item.MENUITEMID, 'AVAILQTY', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="flex items-end pb-1.5 sm:col-span-2">
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer group bg-white px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={state.ISBASE}
                            onChange={(e) => updateItemField(item.MENUITEMID, 'ISBASE', e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">Base</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group bg-white px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={state.ISPREBOOK}
                            onChange={(e) => updateItemField(item.MENUITEMID, 'ISPREBOOK', e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">Pre-Book</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer group bg-white px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={state.ISKIOSK}
                            onChange={(e) => updateItemField(item.MENUITEMID, 'ISKIOSK', e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">Kiosk</span>
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
      <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl z-10 sticky bottom-0 flex gap-3">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-300 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? "Saving..." : `Save Draft (${getSelectedCount()})`}
        </button>
        {isManager && (
          <button
            onClick={handleSaveAndPublishClick}
            disabled={!canSave}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 text-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Publishing...
              </>
            ) : (
              `✓ Save & Publish`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
