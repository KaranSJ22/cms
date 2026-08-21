import React, { useState, useEffect } from "react";
import { getActiveCanteens } from "../../dayslot/api/daySlotsApi";

export default function CanteenDateSelector({ onContextChange }) {
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState("");
  
  // Default to tomorrow
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };
  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());

  useEffect(() => {
    async function loadCanteens() {
      try {
        const canteenData = await getActiveCanteens();
        setCanteens(canteenData || []);
        
        // Auto-select first canteen if none selected
        if (canteenData && canteenData.length > 0 && !selectedCanteen) {
          setSelectedCanteen(canteenData[0].CANTEENID);
        }
      } catch (err) {
        console.error("Failed to load canteens", err);
      }
    }
    loadCanteens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger parent update whenever context changes
  useEffect(() => {
    if (selectedCanteen && selectedDate) {
      onContextChange({ canteenId: selectedCanteen, serviceDate: selectedDate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCanteen, selectedDate]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="p-4 sm:p-6 bg-slate-50 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Canteen</label>
          <select
            value={selectedCanteen}
            onChange={(e) => setSelectedCanteen(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="" disabled>Select Canteen...</option>
            {canteens.map((c) => (
              <option key={c.CANTEENID} value={c.CANTEENID}>{c.CANTEENNAME}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
