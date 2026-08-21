import React, { useState, useEffect } from "react";
import { getActiveCanteens, getDaySlots } from "../../dayslot/api/daySlotsApi";
import * as servicesApi from "../../services/api/servicesApi";

export default function KitchenContextBar({ onSlotResolved }) {
  const [canteens, setCanteens] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const [isResolving, setIsResolving] = useState(false);
  const [resolvedSlot, setResolvedSlot] = useState(null);

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
        console.error("Failed to load initial context data", err);
      }
    }
    loadInitialData();
  }, []);

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
            onSlotResolved(slot);
          } else {
            setResolvedSlot(null);
            onSlotResolved(null);
          }
        } catch (error) {
          console.error("Failed to resolve slot", error);
          setResolvedSlot(null);
          onSlotResolved(null);
        } finally {
          setIsResolving(false);
        }
      } else {
        setResolvedSlot(null);
        onSlotResolved(null);
      }
    }
    resolveSlot();
  }, [selectedCanteen, selectedDate, selectedService, onSlotResolved]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="p-6 bg-slate-50 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold text-slate-800">Select Day Slot Context</h2>
          
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
                Slot Active
              </span>
            ) : selectedCanteen && selectedDate && selectedService ? (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                No active slot for this selection
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
  );
}
