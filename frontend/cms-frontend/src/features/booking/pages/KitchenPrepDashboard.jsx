import { useState, useEffect, useCallback } from "react";
import KitchenContextBar from "../components/KitchenContextBar";
import PrepItemCard from "../components/PrepItemCard";
import { useKitchenPrep } from "../hooks/useKitchenPrep";

export default function KitchenPrepDashboard() {
  const [activeSlot, setActiveSlot] = useState(null);
  const { prepData, loading, error, fetchPrepData } = useKitchenPrep();

  const handleSlotResolved = useCallback((slot) => {
    setActiveSlot(slot);
    if (slot) {
      fetchPrepData(slot.DAYSLOTID);
    } else {
      fetchPrepData(null);
    }
  }, [fetchPrepData]);

  // Optional: Auto-refresh data every 30 seconds if a slot is active
  useEffect(() => {
    if (!activeSlot) return;
    
    const interval = setInterval(() => {
      fetchPrepData(activeSlot.DAYSLOTID);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeSlot, fetchPrepData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header aligned with ISRO Space Blue / Saffron design */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Kitchen Preparation
            </h1>
            <p className="mt-2 text-blue-100/80 max-w-xl">
              Live aggregate metrics of ordered vs served items for the active service slot.
            </p>
          </div>
          {activeSlot && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-white font-medium text-sm">Live Updates Active</span>
            </div>
          )}
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

      {/* Context Selection Bar */}
      <KitchenContextBar onSlotResolved={handleSlotResolved} />

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {!activeSlot ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Context Selected</h3>
            <p className="max-w-md text-slate-500">
              Please select a Canteen, Date, and Service above to load the kitchen preparation metrics for that specific slot.
            </p>
          </div>
        ) : loading && prepData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center bg-white rounded-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin"></div>
          </div>
        ) : prepData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 mb-1">No Menu Items Found</h3>
            <p className="text-sm">There are no approved day menu items for this slot.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {prepData.map((item) => (
              <PrepItemCard key={item.MENUITEMID} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
