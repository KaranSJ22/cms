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
    return <div className="p-8 text-center">Loading pricing data...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header aligned with ISRO Space Blue / Saffron design */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Menu Item Pricing
          </h1>
          <p className="mt-2 text-blue-100/80 max-w-xl">
            Assign and update prices for menu items across different customer categories.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50/80 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-3">
          <svg className="mt-0.5 shrink-0 text-rose-500 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Item Selector */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Menu Item to Price</label>
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
          className="w-full max-w-md bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
        >
          <option value="">-- Choose an Item --</option>
          {menuItems.map(item => (
            <option key={item.MENUITEMID} value={item.MENUITEMID}>
              {item.ITEMNAME} ({item.SHORTNAME || item.MENUCODE})
            </option>
          ))}
        </select>
      </div>

      {selectedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Current Effective Prices */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-[#0F172A]">Currently Effective Prices</h2>
              <p className="text-sm text-slate-500">Live prices active for bookings today.</p>
            </div>
            <div className="p-5 grid gap-4">
              {effectivePrices.length === 0 ? (
                <div className="text-center p-6 text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                  No prices defined yet. Item will show as ₹0.
                </div>
              ) : (
                effectivePrices.map(price => (
                  <div key={price.ITEMPRICEDTID} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{price.CTYPENAME}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">{price.CTYPECODE}</p>
                    </div>
                    <div className="text-2xl font-black text-[#F4C430]">
                      ₹{parseFloat(price.PRICE).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add New Price Band Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-[#0F172A]">Assign New Prices</h2>
              <p className="text-sm text-slate-500">Schedule a new price band effective from a specific date.</p>
            </div>
            <div className="p-5 flex-1">
              <form onSubmit={handleAddPrice} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Effective From Date</label>
                  <input
                    type="date"
                    required
                    value={effFrom}
                    onChange={(e) => setEffFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Prices by Customer Type (₹)</label>
                  {customerTypes.map(ct => (
                    <div key={ct.CTYPECODE} className="flex items-center gap-3">
                      <div className="w-1/2">
                        <span className="text-sm font-medium text-slate-600">{ct.CTYPENAME}</span>
                      </div>
                      <div className="w-1/2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={newPrices[ct.CTYPECODE] || ""}
                          onChange={(e) => handlePriceChange(ct.CTYPECODE, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F4C430] hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-4 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Publish New Prices"}
                </button>
              </form>
            </div>
          </div>

          {/* History Table spanning full width */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-[#0F172A]">Pricing History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Effective From</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {priceHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                        No pricing history found.
                      </td>
                    </tr>
                  ) : (
                    priceHistory.map((hist) => (
                      <tr key={hist.ITEMPRICEID} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {new Date(hist.EFFFROM).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            hist.STATUSCODE === 'ACT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {hist.STATUSCODE === 'ACT' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {new Date(hist.CREATEDAT).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {hist.STATUSCODE === 'ACT' && new Date(hist.EFFFROM) > new Date() && (
                            <button
                              onClick={() => handleDeactivate(hist.ITEMPRICEID)}
                              className="text-rose-600 hover:text-rose-800 font-medium text-sm transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
