import React, { useState, useEffect } from "react";
import { useDayMenu } from "../hooks/useDayMenu";
import SingleDayBuilder from "../components/SingleDayBuilder";
import DayMenuTable from "../components/DayMenuTable";

import * as servicesApi from "../../services/api/servicesApi";
import { getActiveCanteens, getDaySlots } from "../../dayslot/api/daySlotsApi";

export default function DayMenuPlannerPage() {
  const { dayMenus, loading, error, fetchDayMenus, addDayMenu } = useDayMenu();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Context State
  const [canteens, setCanteens] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedService, setSelectedService] = useState("");
  
  const [resolvedSlot, setResolvedSlot] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [canteenData, serviceData] = await Promise.all([
          getActiveCanteens(),
          servicesApi.getServices(),
        ]);
        setCanteens(canteenData || []);
        setServices((serviceData || []).filter((s) => s.STATUS === "A"));
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    }
    loadInitialData();
  }, []);

  // Try to resolve the DAYSLOTID whenever the 3 context fields change
  useEffect(() => {
    async function resolveSlot() {
      if (selectedCanteen && selectedDate && selectedService) {
        setIsResolving(true);
        try {
          const slots = await getDaySlots({
            CANTEENID: selectedCanteen,
            SERVICEID: selectedService,
            DATEFROM: selectedDate,
            DATETO: selectedDate,
          });
          
          if (slots && slots.length > 0) {
            const slot = slots[0];
            setResolvedSlot(slot);
            fetchDayMenus({ DAYSLOTID: slot.DAYSLOTID });
          } else {
            setResolvedSlot(null);
          }
        } catch (error) {
          console.error("Failed to resolve slot", error);
          setResolvedSlot(null);
        } finally {
          setIsResolving(false);
        }
      } else {
        setResolvedSlot(null);
      }
    }
    resolveSlot();
  }, [selectedCanteen, selectedDate, selectedService, fetchDayMenus]);

  const handleSaveSelection = async (itemsToSave) => {
    if (itemsToSave.length === 0) return;
    
    setIsSubmitting(true);
    for (const item of itemsToSave) {
      await addDayMenu(item);
    }
    setIsSubmitting(false);
    
    // Refresh table
    if (resolvedSlot) {
      fetchDayMenus({ DAYSLOTID: resolvedSlot.DAYSLOTID });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header aligned with ISRO Space Blue / Saffron design */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Day Menu Planner
          </h1>
          <p className="mt-2 text-blue-100/80 max-w-xl">
            Streamlined UX to assign menu catalog items into day slots quickly.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50/80 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-3">
          <svg className="mt-0.5 shrink-0 text-rose-500 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Step 1: Select Day Slot (Full Width Context Bar) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Step 1: Select Day Slot</h2>
            {/* Status Indicator */}
            <div>
              {isResolving ? (
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium flex items-center gap-2">
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full"></span>
                  Resolving...
                </span>
              ) : resolvedSlot ? (
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Slot Found
                </span>
              ) : selectedCanteen && selectedDate && selectedService ? (
                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  No Slot Found
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Canteen</label>
              <select
                value={selectedCanteen}
                onChange={(e) => setSelectedCanteen(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select Canteen</option>
                {canteens.map((c) => (
                  <option key={c.CANTEENID} value={c.CANTEENID}>{c.CANTEENNAME}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Service</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select Service</option>
                {services.map((s) => (
                  <option key={s.SERVICEID} value={s.SERVICEID}>{s.SERVNAME}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 50/50 Split Layout for Builder and Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Side: Single-Column Menu Catalog Builder */}
        <div className="flex flex-col h-[700px]">
          <SingleDayBuilder 
            resolvedSlot={resolvedSlot}
            onSaveSelection={handleSaveSelection}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right Side: Current Table */}
        <div className="flex flex-col h-[700px]">
          {resolvedSlot ? (
            loading && dayMenus.length === 0 ? (
              <div className="p-12 flex justify-center items-center bg-white rounded-xl shadow-sm border border-slate-200 h-full">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin"></div>
              </div>
            ) : (
              <DayMenuTable dayMenus={dayMenus} />
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
              <svg className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-slate-700 mb-1">No Slot Selected</h3>
              <p className="max-w-xs text-sm">Resolve a day slot above to view its current menu and start adding items.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
