import { useState, useCallback } from "react";
import KitchenContextBar from "../../booking/components/KitchenContextBar";
import { getKitchenPrep } from "../../booking/api/bookingApi";

export default function KitchenSummaryPage() {
  const [activeSlot, setActiveSlot] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSlotResolved = useCallback(async (slot) => {
    setActiveSlot(slot);
    if (!slot) {
      setSummaryData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getKitchenPrep(slot.DAYSLOTID);
      setSummaryData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load production summary for the selected slot.");
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const totalBooked = summaryData.reduce((acc, i) => acc + (Number(i.BOOKEDQTY) || 0), 0);
  const totalServed = summaryData.reduce((acc, i) => acc + (Number(i.SERVEDQTY) || 0), 0);
  const totalRemaining = totalBooked > totalServed ? totalBooked - totalServed : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-inter">
      {/* Space Blue Header */}
      <div className="bg-[#0F172A] rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-grotesk tracking-tight">
              Kitchen Production Summary
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Detailed meal and dish summary reports by canteen, date, and service.
            </p>
          </div>
          {activeSlot && (
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Context Selector */}
      <KitchenContextBar onSlotResolved={handleSlotResolved} />

      {/* Loading / Error States */}
      {loading && (
        <div className="p-12 text-center text-slate-400 text-sm">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading production summary...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Totals Summary Banner */}
      {activeSlot && summaryData.length > 0 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Booked</span>
            <p className="text-3xl font-black text-orange-600 font-mono mt-1">{totalBooked}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Served</span>
            <p className="text-3xl font-black text-emerald-600 font-mono mt-1">{totalServed}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining to Serve</span>
            <p className="text-3xl font-black text-amber-600 font-mono mt-1">{totalRemaining}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {activeSlot && summaryData.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryData.map((item, idx) => {
            const booked = Number(item.BOOKEDQTY) || 0;
            const served = Number(item.SERVEDQTY) || 0;
            const pending = booked > served ? booked - served : 0;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-widest text-orange-500">
                      {item.ISBASE ? "Base Item" : "Menu Offering"}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {item.ITEMNAME || `Item #${item.MENUITEMID}`}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-900 text-white font-mono">
                    {booked} ordered
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[0.65rem] font-bold uppercase text-emerald-700">Served</span>
                    <p className="text-xl font-black text-emerald-800 font-mono mt-0.5">{served}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <span className="text-[0.65rem] font-bold uppercase text-amber-700">Remaining</span>
                    <p className="text-xl font-black text-amber-800 font-mono mt-0.5">{pending}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!activeSlot && !loading && (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
          Select Canteen, Date, and Service above to load the kitchen production summary.
        </div>
      )}
    </div>
  );
}
