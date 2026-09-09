import { useState, useEffect } from "react";
import { useDayMenu } from "../hooks/useDayMenu";
import SingleDayBuilder from "../components/SingleDayBuilder";
import DayMenuTable from "../components/DayMenuTable";
import { useAuth } from "../../../hooks/useAuth";

import * as servicesApi from "../../services/api/servicesApi";
import { getActiveCanteens, getDaySlots, getDaySlot } from "../../dayslot/api/daySlotsApi";

export default function DayMenuPlannerPage() {
  const { user } = useAuth();
  const { 
    dayMenus, 
    loading, 
    error, 
    setError,
    fetchDayMenuWorkspace, 
    replaceMenuItems,
    submitMenu,
    approveMenu,
    rejectMenu
  } = useDayMenu();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

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
        
        // Filter canteens to only those the user has a role in
        const userCanteenIds = (user?.CANTEENROLES || []).map(r => r.CANTEENID);
        const hasAdminRole = (user?.SYSTEMROLES || []).includes('SYSADM');
        
        let filteredCanteens = canteenData || [];
        if (!hasAdminRole) {
          filteredCanteens = filteredCanteens.filter(c => userCanteenIds.includes(c.CANTEENID));
        }
        
        setCanteens(filteredCanteens);
        setServices((serviceData || []).filter((s) => s.STATUSCODE === "ACT"));
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    }
    loadInitialData();
  }, [user]);

  // Try to resolve the DAYSLOTID whenever the 3 context fields change
  useEffect(() => {
    async function resolveSlot() {
      if (selectedCanteen && selectedDate && selectedService) {
        setIsResolving(true);
        setError(null);
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
            await fetchDayMenuWorkspace(slot.DAYSLOTID);
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
  }, [selectedCanteen, selectedDate, selectedService, fetchDayMenuWorkspace, setError]);

  const handleSaveSelection = async (itemsToSave) => {
    if (!resolvedSlot) return;
    setIsSubmitting(true);
    const success = await replaceMenuItems(resolvedSlot.DAYSLOTID, itemsToSave);
    if (success) {
      await fetchDayMenuWorkspace(resolvedSlot.DAYSLOTID);
      // Refresh the exact slot to get updated status (e.g. DRF)
      const updatedSlot = await getDaySlot(resolvedSlot.DAYSLOTID);
      if (updatedSlot) setResolvedSlot(updatedSlot);
    }
    setIsSubmitting(false);
  };

  const handleAction = async (actionFn, actionName, args = []) => {
    if (!resolvedSlot) return;
    setActionLoading(true);
    const success = await actionFn(resolvedSlot.DAYSLOTID, ...args);
    if (success) {
      await fetchDayMenuWorkspace(resolvedSlot.DAYSLOTID);
      const updatedSlot = await getDaySlot(resolvedSlot.DAYSLOTID);
      if (updatedSlot) setResolvedSlot(updatedSlot);
      if (actionName === 'reject') setShowRejectModal(false);
      setRemarks("");
    }
    setActionLoading(false);
  };

  // Check roles for the specific canteen (support both CNTMGR and SYSADM)
  const userCanteenRole = (user?.CANTEENROLES || []).find(r => r.CANTEENID === Number(selectedCanteen))?.ROLECODE;
  const isManager = userCanteenRole === 'CNTMGR' || userCanteenRole === 'CTNMGR' || user?.SYSTEMROLES?.includes('SYSADM');
  
  // Use status from slot (APPRSTATUSCODE from CMSLISTSLOT / CMSGETSLOT)
  const slotStatus = resolvedSlot?.APPRSTATUSCODE || resolvedSlot?.APPRSTATUS || resolvedSlot?.MENUAPPRSTATUS || 'DRF';
  const isDraftOrRejected = slotStatus === 'DRF' || slotStatus === 'REJ';
  const isPending = slotStatus === 'PEN';
  const isApproved = slotStatus === 'APR' || slotStatus === 'APP';

  const handleQuickPublish = async () => {
    if (!resolvedSlot) return;
    setActionLoading(true);
    try {
      // Step 1: Submit to PEN
      const submitSuccess = await submitMenu(resolvedSlot.DAYSLOTID);
      if (submitSuccess) {
        // Step 2: Immediately Approve/Publish
        const approveSuccess = await approveMenu(resolvedSlot.DAYSLOTID, remarks || "Direct approval by Manager");
        if (approveSuccess) {
          await fetchDayMenuWorkspace(resolvedSlot.DAYSLOTID);
          const updatedSlot = await getDaySlot(resolvedSlot.DAYSLOTID);
          if (updatedSlot) setResolvedSlot(updatedSlot);
        }
      }
    } catch (err) {
      console.error("Quick publish failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAndPublish = async (itemsToSave) => {
    if (!resolvedSlot) return;
    setIsSubmitting(true);
    const saveSuccess = await replaceMenuItems(resolvedSlot.DAYSLOTID, itemsToSave);
    if (saveSuccess) {
      // Step 1: Submit to PEN
      const submitSuccess = await submitMenu(resolvedSlot.DAYSLOTID);
      if (submitSuccess) {
        // Step 2: Immediately Approve/Publish
        const approveSuccess = await approveMenu(resolvedSlot.DAYSLOTID, "Direct approval on save");
        if (approveSuccess) {
          await fetchDayMenuWorkspace(resolvedSlot.DAYSLOTID);
          const updatedSlot = await getDaySlot(resolvedSlot.DAYSLOTID);
          if (updatedSlot) setResolvedSlot(updatedSlot);
        }
      }
    }
    setIsSubmitting(false);
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
            Streamlined UX to manage, approve, and publish complete day slot menus.
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

      {/* Step 1: Select Day Slot (Full Width Context Bar) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Step 1: Select Day Slot Context</h2>
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
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Service</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

      {/* Action Bar for the Slot */}
      {resolvedSlot && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Slot Status & Actions</span>
            <div className="flex items-center gap-2 mt-1">
              {slotStatus === 'DRF' && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>}
              {slotStatus === 'REJ' && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">REJECTED</span>}
              {slotStatus === 'PEN' && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">PENDING APPROVAL</span>}
              {isApproved && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✓ APPROVED & PUBLISHED</span>}
              
              <span className="text-slate-600 text-sm font-medium">
                {slotStatus === 'DRF' && "Menu is in draft state. Save items, then submit or publish."}
                {slotStatus === 'REJ' && "Menu was rejected. Make corrections and resubmit."}
                {slotStatus === 'PEN' && "Waiting for Canteen Manager review and approval."}
                {isApproved && "Menu is live! Employees can now pre-book meals."}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {/* Draft Actions */}
            {isDraftOrRejected && (
              <>
                <button
                  onClick={() => handleAction(submitMenu, 'submit')}
                  disabled={actionLoading || isSubmitting || dayMenus.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit for Approval'}
                </button>
                {isManager && (
                  <button
                    onClick={handleQuickPublish}
                    disabled={actionLoading || isSubmitting || dayMenus.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors shadow-sm shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {actionLoading ? 'Publishing...' : '✓ Approve & Publish Menu'}
                  </button>
                )}
              </>
            )}
            
            {/* Pending Approval Actions for Manager */}
            {isPending && isManager && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-sm rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                >
                  Reject Menu
                </button>
                <button
                  onClick={() => handleAction(approveMenu, 'approve', [remarks])}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : '✓ Approve & Publish Menu'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 50/50 Split Layout for Builder and Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Side: Single-Column Menu Catalog Builder */}
        <div className="flex flex-col h-[700px]">
          <SingleDayBuilder 
            resolvedSlot={resolvedSlot}
            initialWorkspaceItems={dayMenus}
            onSaveSelection={handleSaveSelection}
            onSaveAndPublish={handleSaveAndPublish}
            isManager={isManager}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right Side: Current Table */}
        <div className="flex flex-col h-[700px]">
          {resolvedSlot ? (
            loading && dayMenus.length === 0 ? (
              <div className="p-12 flex justify-center items-center bg-white rounded-xl shadow-sm border border-slate-200 h-full">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Reject Menu</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Remarks (Required)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                placeholder="Explain what needs to be changed..."
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(rejectMenu, 'reject', [remarks])}
                disabled={actionLoading || !remarks.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
