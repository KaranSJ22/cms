import { useState, useEffect, useMemo } from "react";
import api from "../../../config/axios";
import { useAuth } from "../../../hooks/useAuth";
import {
  getOfficialServices,
  createOfficialService,
  updateOfficialService,
  createOfficialCombo,
  getOfficialMenuItems,
} from "../api/officialApi";
import {
  PlusIcon,
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CubeIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import ComboItemPicker from "../components/ComboItemPicker";
import ComboCostCalculator from "../components/ComboCostCalculator";

export default function OfficialServicesManagerPage() {
  const { user, activeCanteenId, setActiveCanteenId } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState(activeCanteenId || "");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & In-Page Studio
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({ SERVNAME: "", DESCR: "", CUTOFFHOURS: 24, REQAPPRLVL: "L1" });
  const [showComboModal, setShowComboModal] = useState(null); // target serviceId (active in-page studio)
  const [comboForm, setComboForm] = useState({ COMBONAME: "", DESCR: "", COMBOPRICE: 0, ITEMS: [] });
  const [handlingCharge, setHandlingCharge] = useState(0);
  const [availableItems, setAvailableItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCombos, setExpandedCombos] = useState({});

  const toggleExpandCombo = (serviceId, comboId) => {
    setExpandedCombos((prev) => {
      const current = prev[serviceId];
      return {
        ...prev,
        [serviceId]: current === comboId ? null : comboId,
      };
    });
  };

  // 1. Fetch Canteens and filter strictly by manager's assigned canteens
  useEffect(() => {
    api.get("/canteens").then((res) => {
      const list = res.data.DATA || [];
      const userCanteenIds = (user?.CANTEENROLES || []).map((r) => r.CANTEENID);
      const hasAdminRole = (user?.SYSTEMROLES || []).includes("SYSADM");

      const allowed = hasAdminRole
        ? list
        : list.filter((c) => userCanteenIds.includes(c.CANTEENID));

      setCanteens(allowed);

      if (allowed.length > 0) {
        const isCurrentValid = allowed.some((c) => c.CANTEENID === Number(selectedCanteenId));
        if (!isCurrentValid) {
          const matched = allowed.find((c) => c.CANTEENID === Number(activeCanteenId));
          const targetId = matched ? matched.CANTEENID : allowed[0].CANTEENID;
          setSelectedCanteenId(targetId);
          if (!activeCanteenId) {
            setActiveCanteenId(targetId);
          }
        }
      }
    });
  }, [user]);

  // Keep selectedCanteenId in sync when activeCanteenId changes in header or sidebar
  useEffect(() => {
    if (activeCanteenId && canteens.some((c) => c.CANTEENID === Number(activeCanteenId))) {
      setSelectedCanteenId(Number(activeCanteenId));
    }
  }, [activeCanteenId, canteens]);

  // 2. Fetch Services when canteen changes
  const loadServices = async () => {
    if (!selectedCanteenId) return;
    try {
      setLoading(true);
      const data = await getOfficialServices(selectedCanteenId);
      setServices(data || []);
    } catch (err) {
      console.error("Failed to load services", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [selectedCanteenId]);

  // 3. Load Menu Items for combo studio
  useEffect(() => {
    if (showComboModal) {
      setLoadingItems(true);
      getOfficialMenuItems(selectedCanteenId)
        .then((items) => setAvailableItems(items || []))
        .catch((err) => {
          console.error("Failed to load menu items", err);
          setAvailableItems([]);
        })
        .finally(() => setLoadingItems(false));
    }
  }, [showComboModal, selectedCanteenId]);

  // Calculations for In-Page Combo Studio
  const activeService = useMemo(() => {
    return services.find((s) => s.OFFSERVID === Number(showComboModal));
  }, [services, showComboModal]);

  const grossTotal = useMemo(() => {
    return comboForm.ITEMS.reduce(
      (sum, it) => sum + ((Number(it.PRICE) || 0) * (Number(it.QTY) || 1)),
      0
    );
  }, [comboForm.ITEMS]);

  const totalPortions = useMemo(() => {
    return comboForm.ITEMS.reduce((sum, it) => sum + (Number(it.QTY) || 1), 0);
  }, [comboForm.ITEMS]);

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createOfficialService({
        CANTEENID: Number(selectedCanteenId),
        SERVNAME: serviceForm.SERVNAME.trim(),
        DESCR: serviceForm.DESCR.trim(),
        CUTOFFHOURS: Number(serviceForm.CUTOFFHOURS),
        REQAPPRLVL: serviceForm.REQAPPRLVL || "L1",
      });
      setShowServiceModal(false);
      setServiceForm({ SERVNAME: "", DESCR: "", CUTOFFHOURS: 24, REQAPPRLVL: "L1" });
      loadServices();
    } catch (err) {
      alert(err.response?.data?.MESSAGE || err.message || "Failed to create service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenComboStudio = (serviceId) => {
    setShowComboModal(serviceId);
    setComboForm({ COMBONAME: "", DESCR: "", COMBOPRICE: 0, ITEMS: [] });
    setHandlingCharge(0);
  };

  const handleCreateCombo = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!comboForm.COMBONAME.trim()) {
      alert("Please enter a Combo Package Name");
      return;
    }
    if (!comboForm.ITEMS || comboForm.ITEMS.length === 0) {
      alert("Please add at least one menu item to the combo");
      return;
    }
    if (!comboForm.COMBOPRICE || Number(comboForm.COMBOPRICE) <= 0) {
      alert("Please enter a valid Combo Unit Price");
      return;
    }

    try {
      setSubmitting(true);
      await createOfficialCombo({
        OFFSERVID: Number(showComboModal),
        COMBONAME: comboForm.COMBONAME.trim(),
        DESCR: comboForm.DESCR.trim(),
        GROSSPRICE: Number(grossTotal.toFixed(2)),
        HANDLINGCHARGE: Number(handlingCharge.toFixed(2)),
        COMBOPRICE: Number(comboForm.COMBOPRICE),
        ITEMS: comboForm.ITEMS.map((it) => ({
          MENUITEMID: it.MENUITEMID,
          QTY: it.QTY || 1,
        })),
      });
      setShowComboModal(null);
      setComboForm({ COMBONAME: "", DESCR: "", COMBOPRICE: 0, ITEMS: [] });
      setHandlingCharge(0);
      loadServices();
    } catch (err) {
      alert(err.response?.data?.MESSAGE || err.message || "Failed to create combo");
    } finally {
      setSubmitting(false);
    }
  };

  const addItemToCombo = (itemOrId) => {
    const item = typeof itemOrId === "object"
      ? itemOrId
      : availableItems.find((i) => i.MENUITEMID === Number(itemOrId));
    if (!item) return;
    if (comboForm.ITEMS.some((i) => i.MENUITEMID === item.MENUITEMID)) return;
    const displayName = item.ITEMNAME || item.MENUNAME || item.SHORTNAME || "Item";
    const itemPrice = Number(item.UNITPRICE || item.OFFPRICE || 0);

    setComboForm((prev) => {
      const newItems = [
        ...prev.ITEMS,
        {
          MENUITEMID: item.MENUITEMID,
          MENUNAME: displayName,
          PRICE: itemPrice,
          QTY: 1,
        },
      ];
      const newGross = newItems.reduce(
        (sum, it) => sum + ((Number(it.PRICE) || 0) * (Number(it.QTY) || 1)),
        0
      );
      return {
        ...prev,
        ITEMS: newItems,
        COMBOPRICE: prev.COMBOPRICE === 0 ? newGross : prev.COMBOPRICE,
      };
    });
  };

  const removeItemFromCombo = (menuItemId) => {
    setComboForm((prev) => {
      const newItems = prev.ITEMS.filter((i) => i.MENUITEMID !== menuItemId);
      const newGross = newItems.reduce(
        (sum, it) => sum + ((Number(it.PRICE) || 0) * (Number(it.QTY) || 1)),
        0
      );
      return {
        ...prev,
        ITEMS: newItems,
        COMBOPRICE: prev.COMBOPRICE === 0 ? newGross : prev.COMBOPRICE,
      };
    });
  };

  const updateItemQty = (menuItemId, qty) => {
    setComboForm((prev) => {
      const newItems = prev.ITEMS.map((i) =>
        i.MENUITEMID === menuItemId ? { ...i, QTY: Math.max(1, Number(qty)) } : i
      );
      return {
        ...prev,
        ITEMS: newItems,
      };
    });
  };

  const handleHandlingChange = (val) => {
    const charge = Math.max(0, Number(val) || 0);
    setHandlingCharge(charge);
  };

  const handleSyncSuggestedPrice = () => {
    setComboForm((prev) => ({
      ...prev,
      COMBOPRICE: grossTotal,
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ============================================================
          VIEW 1: IN-PAGE COMBO CREATION STUDIO (Dual-Column Layout)
          ============================================================ */}
      {showComboModal ? (
        <div className="space-y-6">
          {/* Top Bar Navigation for Studio */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowComboModal(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Back to Services"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                    Combo Studio
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white font-grotesk tracking-tight">
                    {activeService?.SERVNAME || "Official Catering Service"}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bundle catalog items into fixed-price packages. Browse dishes on the left, review live pricing on the right.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowComboModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCombo}
                disabled={submitting || comboForm.ITEMS.length === 0 || !comboForm.COMBONAME.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? "Saving..." : "Save Combo Package"}
              </button>
            </div>
          </div>

          {/* Dual-Column Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Menu Items Catalog Shelf (7 cols / ~58%) */}
            <div className="lg:col-span-7">
              <ComboItemPicker
                availableItems={availableItems}
                loadingItems={loadingItems}
                selectedItems={comboForm.ITEMS}
                onAddItem={addItemToCombo}
              />
            </div>

            {/* RIGHT COLUMN: Combo Details, Added Items, and Cost Calculator (5 cols / ~42%) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card 1: Package Identity */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-grotesk">
                  1. Combo Package Info
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Combo Package Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samosa + Filter Coffee Snack Pack"
                    value={comboForm.COMBONAME}
                    onChange={(e) => setComboForm({ ...comboForm, COMBONAME: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Service Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Served in paper conference trays with mint chutney"
                    value={comboForm.DESCR}
                    onChange={(e) => setComboForm({ ...comboForm, DESCR: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              {/* Card 2: Selected Dishes Tray */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-grotesk">
                    2. Included Dishes ({comboForm.ITEMS.length} dishes, {totalPortions} portions)
                  </h3>
                  {comboForm.ITEMS.length === 0 && (
                    <span className="text-[11px] text-amber-500 font-semibold">
                      Add at least 1 dish
                    </span>
                  )}
                </div>

                {comboForm.ITEMS.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-400">
                    No dishes added yet. Click "+ Add" on any dish from the catalog on the left to include it here.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {comboForm.ITEMS.map((it) => {
                      const unitPrice = Number(it.PRICE) || 0;
                      const lineTotal = unitPrice * (Number(it.QTY) || 1);

                      return (
                        <div
                          key={it.MENUITEMID}
                          className="pt-2.5 first:pt-0 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {it.MENUNAME || it.ITEMNAME}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              ₹{unitPrice.toFixed(2)} ea × {it.QTY} ={" "}
                              <strong className="text-slate-700 dark:text-slate-300 font-mono">
                                ₹{lineTotal.toFixed(2)}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Quantity Stepper */}
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateItemQty(it.MENUITEMID, Math.max(1, Number(it.QTY) - 1))}
                                className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer transition-colors"
                                disabled={Number(it.QTY) <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={it.QTY}
                                onChange={(e) => updateItemQty(it.MENUITEMID, e.target.value)}
                                className="w-10 py-0.5 text-xs text-center font-bold bg-transparent text-slate-900 dark:text-white outline-none border-x border-slate-200 dark:border-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateItemQty(it.MENUITEMID, Number(it.QTY) + 1)}
                                className="px-2 py-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer transition-colors"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItemFromCombo(it.MENUITEMID)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Remove from combo"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card 3: Live Costing & Price Breakdown Calculator */}
              <ComboCostCalculator
                grossTotal={grossTotal}
                handlingCharge={handlingCharge}
                onHandlingChange={handleHandlingChange}
                comboPrice={comboForm.COMBOPRICE}
                onComboPriceChange={(val) => setComboForm({ ...comboForm, COMBOPRICE: val })}
                onSyncSuggested={handleSyncSuggestedPrice}
              />

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComboModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCombo}
                  disabled={submitting || comboForm.ITEMS.length === 0 || !comboForm.COMBONAME.trim()}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving Combo..." : "Save Combo Package"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================
            VIEW 2: SERVICES & COMBOS OVERVIEW LIST
            ============================================================ */
        <div>
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-grotesk">
                Official Services & Combos
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure official catering categories, predefined combo bundles, and lead-time cutoffs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedCanteenId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedCanteenId(val);
                  setActiveCanteenId(val);
                }}
                className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {canteens.map((c) => (
                  <option key={c.CANTEENID} value={c.CANTEENID} className="bg-slate-900 text-white">
                    {c.CANTEENNAME} ({c.CANTEENCODE})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowServiceModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Service</span>
              </button>
            </div>
          </div>

          {/* Services List */}
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <SparklesIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">
                No Official Services configured
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Click 'New Service' to create an official catering category (e.g. Official Meeting Snack, Conference Lunch).
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {services.map((svc) => (
                <div
                  key={svc.OFFSERVID}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">
                          {svc.SERVNAME}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            svc.REQAPPRLVL === "L2"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {svc.REQAPPRLVL === "L2" ? "Level 2 Approval Required" : "Level 1 Approval Required"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {svc.DESCR || "Departmental and conference catering service."}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Cutoff Notice
                        </span>
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5 text-orange-500" />
                          {svc.CUTOFFHOURS} hours prior
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenComboStudio(svc.OFFSERVID)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span>Add Combo</span>
                      </button>
                    </div>
                  </div>

                  {/* Combos Grid */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Predefined Combos under this service ({svc.COMBOS?.length || 0})
                      </h4>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Click any combo card to view included dishes
                      </span>
                    </div>

                    {!svc.COMBOS || svc.COMBOS.length === 0 ? (
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-400 text-center border border-dashed border-slate-200 dark:border-slate-700">
                        No combos added yet. Click 'Add Combo' to configure packaged options with live dish costing.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                        {svc.COMBOS.map((combo) => {
                          const isExpanded = expandedCombos[svc.OFFSERVID] === combo.OFFCOMBOID;
                          const itemCount = combo.ITEMS?.length || 0;
                          const grossPrice = Number(combo.GROSSPRICE !== undefined && combo.GROSSPRICE !== null ? combo.GROSSPRICE : combo.COMBOPRICE);
                          const handlingFee = Number(combo.HANDLINGCHARGE || 0);

                          return (
                            <div
                              key={combo.OFFCOMBOID}
                              className={`bg-slate-50/90 rounded-xl p-4 border transition-all flex flex-col ${
                                isExpanded
                                  ? "border-orange-500 bg-orange-50/20 shadow-md ring-1 ring-orange-500/20"
                                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                              }`}
                            >
                              <div>
                                <div
                                  onClick={() => toggleExpandCombo(svc.OFFSERVID, combo.OFFCOMBOID)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex justify-between items-start gap-2 mb-1.5">
                                    <h5 className="font-bold text-slate-900 text-sm hover:text-orange-600 transition-colors">
                                      {combo.COMBONAME}
                                    </h5>
                                    <div className="text-right shrink-0">
                                      <div className="font-black text-orange-600 text-sm">
                                        ₹{grossPrice.toFixed(2)}
                                        <span className="text-[10px] font-semibold text-slate-500 ml-0.5">/pkg</span>
                                      </div>
                                      {handlingFee > 0 && (
                                        <div className="text-[10px] font-medium text-slate-500">
                                          +₹{handlingFee.toFixed(2)} on total order
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-2.5">
                                    {combo.DESCR || "Standard official catering combo"}
                                  </p>

                                  {/* Dish tags preview */}
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {itemCount === 0 ? (
                                      <span className="text-[11px] text-slate-400 italic">No dishes attached</span>
                                    ) : (
                                      combo.ITEMS.map((dish) => (
                                        <span
                                          key={dish.COMBOITEMID || dish.MENUITEMID}
                                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                                        >
                                          <span>{dish.MENUNAME || dish.ITEMNAME}</span>
                                          <span className="text-orange-600 font-bold">×{dish.QTY}</span>
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Expanded dishes drawer */}
                                {isExpanded && combo.ITEMS && combo.ITEMS.length > 0 && (
                                  <div className="mt-2.5 pt-3 border-t border-slate-200 space-y-2 text-xs">
                                    <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                                      Bundled Dishes ({combo.ITEMS.length})
                                    </div>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                      {combo.ITEMS.map((dish) => (
                                        <div
                                          key={dish.COMBOITEMID || dish.MENUITEMID}
                                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-slate-800 truncate">
                                              {dish.MENUNAME || dish.ITEMNAME}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                              {dish.CATCODE} • Qty: {dish.QTY}
                                            </div>
                                          </div>
                                          <div className="text-right font-mono text-[11px] text-slate-700">
                                            ₹{(Number(dish.OFFPRICE || 0) * Number(dish.QTY || 1)).toFixed(2)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Pricing Breakdown Summary */}
                                    <div className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-200/60 text-[11px] space-y-1.5">
                                      <div className="flex justify-between items-center text-slate-700">
                                        <span className="font-medium">Package Food Rate:</span>
                                        <span className="font-bold font-mono text-slate-900">
                                          ₹{grossPrice.toFixed(2)}{" "}
                                          <span className="text-[10px] font-normal text-slate-500">/ package</span>
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-slate-700">
                                        <span className="font-medium">Handling Fee:</span>
                                        <span className="font-bold font-mono text-slate-900">
                                          {handlingFee > 0 ? (
                                            <>
                                              + ₹{handlingFee.toFixed(2)}{" "}
                                              <span className="text-[10px] font-normal text-slate-500">flat on total order</span>
                                            </>
                                          ) : (
                                            <span className="text-slate-400 font-normal">₹0.00</span>
                                          )}
                                        </span>
                                      </div>
                                      <div className="pt-1.5 border-t border-orange-200/80 flex items-center justify-between text-[10.5px] text-slate-600 bg-white/60 -mx-2.5 -mb-2.5 p-2 rounded-b-lg">
                                        <span>Billing Formula:</span>
                                        <span className="font-mono font-semibold text-orange-700">
                                          (Qty × ₹{grossPrice.toFixed(2)}) {handlingFee > 0 ? `+ ₹${handlingFee.toFixed(2)}` : ""}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 mt-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandCombo(svc.OFFSERVID, combo.OFFCOMBOID)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 cursor-pointer transition-colors"
                                >
                                  <span>{isExpanded ? "Hide Dishes" : `View Dishes (${itemCount})`}</span>
                                  {isExpanded ? (
                                    <ChevronUpIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDownIcon className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Official Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Official Service
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4 text-xs">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-orange-600 dark:text-orange-400 font-medium">
                Catering Facility:{" "}
                <strong className="text-slate-900 dark:text-white font-bold">
                  {canteens.find((c) => c.CANTEENID === Number(selectedCanteenId))?.CANTEENNAME || "Selected Canteen"}{" "}
                  ({canteens.find((c) => c.CANTEENID === Number(selectedCanteenId))?.CANTEENCODE || ""})
                </strong>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official Meeting Snack / High Tea"
                  value={serviceForm.SERVNAME}
                  onChange={(e) => setServiceForm({ ...serviceForm, SERVNAME: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Brief description of when this service applies"
                  value={serviceForm.DESCR}
                  onChange={(e) => setServiceForm({ ...serviceForm, DESCR: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cutoff Notice (Hours Prior) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={serviceForm.CUTOFFHOURS}
                  onChange={(e) => setServiceForm({ ...serviceForm, CUTOFFHOURS: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Minimum advance notice needed before the event date/time.
                </span>
              </div>

              {/* Required Approval Level */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Required Approval Level *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex flex-col p-2.5 rounded-xl border-2 cursor-pointer transition ${
                      serviceForm.REQAPPRLVL === "L1"
                        ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reqApprLvl"
                      value="L1"
                      checked={serviceForm.REQAPPRLVL === "L1"}
                      onChange={() => setServiceForm({ ...serviceForm, REQAPPRLVL: "L1" })}
                      className="hidden"
                    />
                    <span className="text-xs font-bold">Level 1 Approval</span>
                    <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Employee can select either Level 1 or Level 2 officer
                    </span>
                  </label>

                  <label
                    className={`flex flex-col p-2.5 rounded-xl border-2 cursor-pointer transition ${
                      serviceForm.REQAPPRLVL === "L2"
                        ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reqApprLvl"
                      value="L2"
                      checked={serviceForm.REQAPPRLVL === "L2"}
                      onChange={() => setServiceForm({ ...serviceForm, REQAPPRLVL: "L2" })}
                      className="hidden"
                    />
                    <span className="text-xs font-bold">Level 2 Approval</span>
                    <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Employee can strictly select only a Level 2 officer
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg cursor-pointer transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
