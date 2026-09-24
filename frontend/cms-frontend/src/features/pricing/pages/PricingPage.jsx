import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getMenuItems } from "../../menu/api/menuApi";
import { getCustomerTypes } from "../../common/api/commonApi";
import { getEffectiveItemPrices, createItemPrice, deactivateItemPrice, getItemPriceHistory } from "../api/pricingApi";

export default function PricingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramItemId = searchParams.get("itemId") || searchParams.get("item") || "";

  const [menuItems, setMenuItems] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  
  const [selectedItem, setSelectedItem] = useState(paramItemId);
  const [effectivePrices, setEffectivePrices] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync if URL query param changes
  useEffect(() => {
    if (paramItemId && paramItemId !== selectedItem) {
      setSelectedItem(paramItemId);
    }
  }, [paramItemId]);

  // Form state
  const [effFrom, setEffFrom] = useState("");
  const [newPrices, setNewPrices] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [itemsRes, ctypesRes] = await Promise.all([
          getMenuItems({ status: "ACT" }),
          getCustomerTypes()
        ]);
        setMenuItems(itemsRes);
        setCustomerTypes(ctypesRes);
        
        // Initialize newPrices state with empty strings for each ctype
        const initialPrices = {};
        ctypesRes.forEach(ct => {
          initialPrices[ct.CTYPECODE] = "";
        });
        setNewPrices(initialPrices);
        
      } catch {
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedItem) return;

    let ignore = false;
    async function loadItemPricing() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [effRes, histRes] = await Promise.all([
          getEffectiveItemPrices(selectedItem, { serviceDate: today }),
          getItemPriceHistory(selectedItem)
        ]);
        if (!ignore) {
          setEffectivePrices(effRes);
          setPriceHistory(histRes);
        }
      } catch {
        if (!ignore) setError("Failed to load item pricing");
      }
    }
    loadItemPricing();
    return () => { ignore = true; };
  }, [selectedItem]);

  const handlePriceChange = (ctypeCode, val) => {
    setNewPrices(prev => ({
      ...prev,
      [ctypeCode]: val
    }));
  };

  const handleCopyLivePrices = () => {
    const copied = {};
    customerTypes.forEach(ct => {
      const matching = effectivePrices.find(p => p.CTYPECODE === ct.CTYPECODE);
      copied[ct.CTYPECODE] = matching && matching.PRICE !== null && matching.PRICE !== undefined 
        ? String(matching.PRICE) 
        : "";
    });
    setNewPrices(copied);
  };

  const handleAddPrice = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Build PRICEJSON
      const priceJson = Object.keys(newPrices)
        .filter(key => newPrices[key] !== "") // Only include filled prices
        .map(key => ({
          CTYPECODE: key,
          PRICE: parseFloat(newPrices[key])
        }));

      if (priceJson.length === 0) throw new Error("Please enter at least one price.");

      await createItemPrice(selectedItem, {
        EFFFROM: effFrom,
        PRICES: priceJson
      });

      // Refresh
      const today = new Date().toISOString().split('T')[0];
      const [effRes, histRes] = await Promise.all([
        getEffectiveItemPrices(selectedItem, { serviceDate: today }),
        getItemPriceHistory(selectedItem)
      ]);
      setEffectivePrices(effRes);
      setPriceHistory(histRes);
      
      // Reset form
      setEffFrom("");
      const initialPrices = {};
      customerTypes.forEach(ct => { initialPrices[ct.CTYPECODE] = ""; });
      setNewPrices(initialPrices);
      
      alert("Prices updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update prices");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (itemPriceId) => {
    if (!window.confirm("Are you sure you want to deactivate this price band?")) return;
    try {
      await deactivateItemPrice(itemPriceId);
      // Refresh history
      const histRes = await getItemPriceHistory(selectedItem);
      setPriceHistory(histRes);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to deactivate");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading pricing data...</div>;
  }

  const currentItem = menuItems.find(item => String(item.MENUITEMID) === String(selectedItem));

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-7xl mx-auto pb-8">
      {/* Consolidated Header & Selection Toolbar */}
      <div className="bg-[#0F172A] rounded-2xl p-5 md:px-7 md:py-4.5 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-200 border border-blue-400/20">
              Rate Master
            </span>
            {currentItem && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-[#F4C430] border border-amber-400/20">
                {currentItem.SHORTNAME || currentItem.MENUCODE}
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Menu Item Pricing
          </h1>
          <p className="text-xs text-blue-100/70 mt-0.5">
            Configure, schedule, and inspect multi-tier category rates.
          </p>
        </div>

        {/* Integrated Menu Item Selector */}
        <div className="relative z-10 w-full md:w-auto min-w-[300px] max-w-md">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-blue-200/90 mb-1">
            Select Menu Item to Price
          </label>
          <select
            value={selectedItem}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedItem(val);
              if (val) {
                setSearchParams({ itemId: val }, { replace: true });
              } else {
                setSearchParams({}, { replace: true });
              }
            }}
            className="w-full bg-slate-800/95 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] block px-3 py-2 shadow-inner transition-colors"
          >
            <option value="" className="bg-slate-900 text-slate-300">-- Choose Menu Item --</option>
            {menuItems.map(item => (
              <option key={item.MENUITEMID} value={item.MENUITEMID} className="bg-slate-900 text-white">
                {item.ITEMNAME} ({item.SHORTNAME || item.MENUCODE})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50/90 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-2.5 text-sm font-medium">
          <svg className="shrink-0 text-rose-500 w-5 h-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {selectedItem ? (
        <div className="space-y-4">
          {/* Horizontal Live Rates Strip (Currently Effective Prices) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Currently Effective Prices (Live Today)
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Active for bookings on {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {customerTypes.map(ct => {
                const matching = effectivePrices.find(p => p.CTYPECODE === ct.CTYPECODE);
                return (
                  <div
                    key={ct.CTYPECODE}
                    className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between hover:bg-white hover:border-amber-300 hover:shadow-2xs transition-all"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-800">
                        {ct.CTYPECODE}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate" title={ct.CTYPENAME}>
                        {ct.CTYPENAME}
                      </span>
                    </div>
                    <div className="mt-2 text-xl font-black text-amber-600 tracking-tight">
                      {matching && matching.PRICE !== null && matching.PRICE !== undefined ? (
                        `₹${parseFloat(matching.PRICE).toFixed(2)}`
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Not Set (₹0.00)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unified Split Workspace: Assign New Prices (Left) + Pricing History (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Panel (Form): Schedule New Price Band */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Assign New Prices</h2>
                  <p className="text-[11px] text-slate-500">Schedule a new effective price band</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLivePrices}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  title="Pre-fill form with today's effective rates"
                >
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Live
                </button>
              </div>

              <form onSubmit={handleAddPrice} className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Effective From Date
                  </label>
                  <input
                    type="date"
                    required
                    value={effFrom}
                    onChange={(e) => setEffFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Prices by Customer Type (₹)
                  </label>
                  <div className="space-y-2">
                    {customerTypes.map(ct => (
                      <div key={ct.CTYPECODE} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/70 border border-slate-200/70">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">{ct.CTYPECODE}</span>
                            <span className="text-[11px] text-slate-500 truncate" title={ct.CTYPENAME}>{ct.CTYPENAME}</span>
                          </div>
                        </div>
                        <div className="relative w-28 shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={newPrices[ct.CTYPECODE] || ""}
                            onChange={(e) => handlePriceChange(ct.CTYPECODE, e.target.value)}
                            className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-6 pr-2 py-1 shadow-2xs text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F4C430] hover:bg-amber-500 text-slate-900 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? "Publishing..." : "Publish New Prices"}
                </button>
              </form>
            </div>

            {/* Right Panel (Table): Pricing History */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Pricing History</h2>
                  <p className="text-[11px] text-slate-500">Historical & scheduled rate bands across all 5 categories</p>
                </div>
                <span className="text-xs font-medium text-slate-500 px-2 py-0.5 rounded-full bg-slate-200/60">
                  {priceHistory.length} Record{priceHistory.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="sticky top-0 z-10 text-[11px] text-slate-600 uppercase bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 font-semibold tracking-wider">
                    <tr>
                      <th className="px-3 py-3 whitespace-nowrap">Effective</th>
                      <th className="px-2 py-3 text-center whitespace-nowrap" title="Permanent Employee">PRM</th>
                      <th className="px-2 py-3 text-center whitespace-nowrap" title="Contract Employee">CNT</th>
                      <th className="px-2 py-3 text-center whitespace-nowrap" title="Other Center Employee">OCE</th>
                      <th className="px-2 py-3 text-center whitespace-nowrap" title="Visitor">VIS</th>
                      <th className="px-2 py-3 text-center whitespace-nowrap" title="Official Request">OFF</th>
                      <th className="px-3 py-3 text-center whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 whitespace-nowrap">Created</th>
                      <th className="px-3 py-3 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {priceHistory.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                          No pricing history found.
                        </td>
                      </tr>
                    ) : (
                      priceHistory.map((hist) => {
                        const getPrice = (code) => {
                          const p = hist.PRICES?.find(
                            item => item.CTYPECODE === code || (code === "CNT" && item.CTYPECODE === "CON")
                          );
                          return p !== undefined && p.PRICE !== null ? `₹${parseFloat(p.PRICE).toFixed(2)}` : null;
                        };

                        const isFuture = new Date(hist.EFFFROM) > new Date();

                        return (
                          <tr key={hist.ITEMPRICEID} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                              {new Date(hist.EFFFROM).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                              {getPrice("PRM") || <span className="text-slate-300 font-normal">—</span>}
                            </td>
                            <td className="px-2 py-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                              {getPrice("CNT") || <span className="text-slate-300 font-normal">—</span>}
                            </td>
                            <td className="px-2 py-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                              {getPrice("OCE") || <span className="text-slate-300 font-normal">—</span>}
                            </td>
                            <td className="px-2 py-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                              {getPrice("VIS") || <span className="text-slate-300 font-normal">—</span>}
                            </td>
                            <td className="px-2 py-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                              {getPrice("OFF") || <span className="text-slate-300 font-normal">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                hist.STATUSCODE === 'ACT' 
                                  ? (isFuture ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                                  : 'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}>
                                {hist.STATUSCODE === 'ACT' ? (isFuture ? 'Scheduled' : 'Active') : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-slate-400">
                              {new Date(hist.CREATEDAT).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                              {hist.STATUSCODE === 'ACT' && isFuture && (
                                <button
                                  onClick={() => handleDeactivate(hist.ITEMPRICEID)}
                                  className="text-rose-600 hover:text-rose-800 font-semibold text-xs transition-colors hover:underline cursor-pointer"
                                >
                                  Deactivate
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800">No Menu Item Selected</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Please choose a menu item from the dropdown selector above to manage live rates and inspect history.
          </p>
        </div>
      )}
    </div>
  );
}
