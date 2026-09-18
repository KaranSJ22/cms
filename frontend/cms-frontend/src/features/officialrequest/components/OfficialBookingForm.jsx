import { useState, useEffect } from "react";
import api from "../../../config/axios";
import {
  getOfficialServices,
  getEligibleApprovers,
  submitOfficialBooking,
} from "../api/officialApi";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  InformationCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

export default function OfficialBookingForm({ onSuccess, initialData = null }) {
  const [canteens, setCanteens] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState(initialData?.CANTEENID || "");
  const [selectedServiceId, setSelectedServiceId] = useState(initialData?.OFFSERVID || "");
  const [selectedComboId, setSelectedComboId] = useState(initialData?.OFFCOMBOID || "");

  const [purpose, setPurpose] = useState(initialData?.PURPOSE || "");
  const [venue, setVenue] = useState(initialData?.VENUE || "");
  const [eventDateTime, setEventDateTime] = useState(
    initialData?.EVENTDATETIME
      ? new Date(initialData.EVENTDATETIME).toISOString().slice(0, 16)
      : ""
  );
  const [quantity, setQuantity] = useState(initialData?.QUANTITY || 10);
  const [noOfPeople, setNoOfPeople] = useState(initialData?.NOOFPEOPLE || 10);

  const [apprLvl, setApprLvl] = useState(initialData?.APPRLVL || "L1");
  const [approvers, setApprovers] = useState([]);
  const [selectedApproverId, setSelectedApproverId] = useState(initialData?.APPROVERID || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Fetch Canteens
  useEffect(() => {
    api
      .get("/canteens")
      .then((res) => {
        const list = res.data.DATA || [];
        setCanteens(list);
        if (list.length > 0 && !selectedCanteenId) {
          setSelectedCanteenId(list[0].CANTEENID);
        }
      })
      .catch((err) => console.error("Failed to load canteens", err));
  }, []);

  // 2. Fetch Services when canteen changes
  useEffect(() => {
    if (!selectedCanteenId) return;
    setServices([]);
    setSelectedServiceId("");
    setSelectedComboId("");

    getOfficialServices(selectedCanteenId, 10)
      .then((data) => {
        setServices(data || []);
        if (data && data.length > 0) {
          setSelectedServiceId(data[0].OFFSERVID);
          if (data[0].COMBOS && data[0].COMBOS.length > 0) {
            setSelectedComboId(data[0].COMBOS[0].OFFCOMBOID);
          }
        }
      })
      .catch((err) => console.error("Failed to load services", err));
  }, [selectedCanteenId]);

  // 3. Update combo when service changes
  const activeService = services.find((s) => s.OFFSERVID === Number(selectedServiceId));
  const activeCombos = activeService?.COMBOS || [];
  const activeCombo = activeCombos.find((c) => c.OFFCOMBOID === Number(selectedComboId));

  useEffect(() => {
    if (activeCombos.length > 0 && !activeCombos.some((c) => c.OFFCOMBOID === Number(selectedComboId))) {
      setSelectedComboId(activeCombos[0].OFFCOMBOID);
    }
  }, [selectedServiceId]);

  // Sync approval level according to service requirement:
  // If service strictly requires L2, force apprLvl to 'L2'
  useEffect(() => {
    if (activeService) {
      if (activeService.REQAPPRLVL === "L2") {
        setApprLvl("L2");
      } else if (!initialData?.APPRLVL && apprLvl !== "L2") {
        setApprLvl("L1");
      }
    }
  }, [activeService]);

  // 4. Fetch Eligible Approvers when apprLvl changes
  useEffect(() => {
    setApprovers([]);
    getEligibleApprovers(apprLvl)
      .then((data) => {
        setApprovers(data || []);
        if (data && data.length > 0 && !selectedApproverId) {
          setSelectedApproverId(data[0].USERID);
        }
      })
      .catch((err) => console.error("Failed to load approvers", err));
  }, [apprLvl]);

  // Pricing calculation: Total = (Quantity * Gross Price) + Handling Charges
  const grossUnitPrice = Number(
    activeCombo?.GROSSPRICE !== undefined && activeCombo?.GROSSPRICE !== null
      ? activeCombo.GROSSPRICE
      : activeCombo?.COMBOPRICE || 0
  );
  const flatHandlingCharge = Number(activeCombo?.HANDLINGCHARGE || 0);
  const totalAmount = Number(((Number(quantity || 0) * grossUnitPrice) + flatHandlingCharge).toFixed(2));

  // Cutoff calculation
  let cutoffWarning = null;
  if (eventDateTime && activeService) {
    const eventTime = new Date(eventDateTime).getTime();
    const now = Date.now();
    const hoursNotice = (eventTime - now) / (1000 * 60 * 60);
    if (hoursNotice < activeService.CUTOFFHOURS) {
      cutoffWarning = `Selected service requires at least ${activeService.CUTOFFHOURS}h notice. You provided approximately ${Math.max(0, Math.floor(hoursNotice))}h.`;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedCanteenId) {
      setError("Please select a catering canteen");
      return;
    }
    if (!selectedServiceId) {
      setError("Please select an Official Service");
      return;
    }
    if (!selectedComboId) {
      setError("Please select a combo package");
      return;
    }
    if (!eventDateTime) {
      setError("Please select the event date and time");
      return;
    }
    if (cutoffWarning) {
      setError(cutoffWarning);
      return;
    }
    if (!selectedApproverId) {
      setError("Please select an eligible Approver Officer");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        CANTEENID: Number(selectedCanteenId),
        OFFSERVID: Number(selectedServiceId),
        OFFCOMBOID: Number(selectedComboId),
        PURPOSE: purpose.trim(),
        VENUE: venue.trim(),
        EVENTDATETIME: new Date(eventDateTime).toISOString(),
        QUANTITY: Number(quantity),
        NOOFPEOPLE: Number(noOfPeople),
        APPRLVL: apprLvl,
        APPROVERID: Number(selectedApproverId),
      };

      const result = await submitOfficialBooking(payload);
      setSuccess(`Booking ${result.BOOKNO} submitted successfully! Forwarded to Approver.`);
      if (onSuccess) {
        setTimeout(() => onSuccess(result), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.MESSAGE || err.message || "Failed to submit official booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
          <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Section 1: Canteen & Service Selection */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-orange-500" />
          1. Catering Canteen & Service
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Catering Canteen *
            </label>
            <select
              value={selectedCanteenId}
              onChange={(e) => setSelectedCanteenId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition"
              required
            >
              {canteens.map((c) => (
                <option key={c.CANTEENID} value={c.CANTEENID}>
                  {c.CANTEENNAME} ({c.CANTEENCODE})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Official Service *
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition"
              required
            >
              {services.map((s) => (
                <option key={s.OFFSERVID} value={s.OFFSERVID}>
                  {s.SERVNAME} (Cutoff: {s.CUTOFFHOURS}h notice)
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeService && (
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Service Policy: </span>
            {activeService.DESCR || "Official departmental meeting and conference catering."} Minimum notice requirement:{" "}
            <span className="font-semibold text-orange-600 dark:text-orange-400">{activeService.CUTOFFHOURS} hours</span> before scheduled event time.
          </div>
        )}

        {/* Combo Selection Cards */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            Select Combo Package *
          </label>
          {activeCombos.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
              No active combo packages configured under this service yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activeCombos.map((combo) => {
                  const isSelected = Number(selectedComboId) === combo.OFFCOMBOID;
                  const grossVal = Number(combo.GROSSPRICE !== undefined && combo.GROSSPRICE !== null ? combo.GROSSPRICE : combo.COMBOPRICE);
                  const handlingVal = Number(combo.HANDLINGCHARGE || 0);

                  return (
                    <div
                      key={combo.OFFCOMBOID}
                      onClick={() => setSelectedComboId(combo.OFFCOMBOID)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{combo.COMBONAME}</h4>
                          <span className="font-black text-orange-600 dark:text-orange-400 text-sm">
                            ₹{grossVal.toFixed(2)}
                            <span className="text-[10px] font-normal text-slate-400 ml-0.5">/portion</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">{combo.DESCR || "Official packaged catering"}</p>

                        {/* Bundled Dish Chips Preview */}
                        {combo.ITEMS && combo.ITEMS.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {combo.ITEMS.map((dish) => (
                              <span
                                key={dish.COMBOITEMID || dish.MENUITEMID}
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                              >
                                <span>{dish.MENUNAME || dish.ITEMNAME}</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">×{dish.QTY}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          {handlingVal > 0 ? `+ ₹${handlingVal.toFixed(2)} flat handling` : "No handling fee"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                            isSelected
                              ? "bg-orange-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {isSelected ? "Selected" : "Choose"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prominent Included Dishes in Selected Combo Panel */}
              {activeCombo && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-grotesk">
                        Included Dishes in {activeCombo.COMBONAME}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                        {activeCombo.ITEMS?.length || 0} dishes
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Gross Rate: <strong className="text-slate-900 dark:text-white">₹{grossUnitPrice.toFixed(2)}</strong> / person
                      {flatHandlingCharge > 0 && (
                        <span> • Flat Handling: <strong className="text-slate-900 dark:text-white">₹{flatHandlingCharge.toFixed(2)}</strong></span>
                      )}
                    </div>
                  </div>

                  {!activeCombo.ITEMS || activeCombo.ITEMS.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 italic text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      No dishes bundled in this combo package yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {activeCombo.ITEMS.map((dish) => (
                        <div
                          key={dish.COMBOITEMID || dish.MENUITEMID}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {dish.MENUNAME || dish.ITEMNAME}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {dish.CATCODE} • Qty: {dish.QTY}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                              ₹{(Number(dish.OFFPRICE || 0) * Number(dish.QTY || 1)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Event Details & Counts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-orange-500" />
          2. Event Details & Attendance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Purpose / Meeting Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Project Review Meeting / VIP Seminar"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Venue / Location *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Conference Hall A, 2nd Floor"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition text-sm"
                required
              />
              <MapPinIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Event Date & Time *
            </label>
            <input
              type="datetime-local"
              value={eventDateTime}
              onChange={(e) => setEventDateTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Quantity (Billable Servings) *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition text-sm"
              required
            />
            <span className="text-[11px] text-slate-400">Total plates/portions ordered</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Number of People (Headcount) *
            </label>
            <input
              type="number"
              min="1"
              value={noOfPeople}
              onChange={(e) => setNoOfPeople(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition text-sm"
              required
            />
            <span className="text-[11px] text-slate-400">Assists kitchen with batch prep</span>
          </div>
        </div>

        {cutoffWarning && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <ClockIcon className="w-4 h-4 flex-shrink-0" />
            <span>{cutoffWarning}</span>
          </div>
        )}
      </div>

      {/* Section 3: Approver Selection (Option 1) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-orange-500" />
          3. Approver Selection (Two-Step Routing)
        </h3>

        {/* Required Approval Policy Badge */}
        {activeService?.REQAPPRLVL === "L2" ? (
          <div className="mb-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
            <div>
              <span className="font-bold">Required Approval Policy:</span> This service (
              <strong>{activeService?.SERVNAME}</strong>) strictly requires <strong>Level 2 approval</strong>.
              Routing is restricted only to senior Level 2 Officers.
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <span className="font-bold">Required Approval Policy:</span> This service requires{" "}
              <strong>Level 1 approval</strong>. You may choose either a Level 1 or Level 2 officer.
            </div>
          </div>
        )}

        {/* Step 1: Approver Tier */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Step 1: Select Approver Classification Level *
          </label>
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition ${
                activeService?.REQAPPRLVL === "L2"
                  ? "border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed opacity-60"
                  : apprLvl === "L1"
                  ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold cursor-pointer"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="apprLvl"
                value="L1"
                disabled={activeService?.REQAPPRLVL === "L2"}
                checked={apprLvl === "L1"}
                onChange={() => activeService?.REQAPPRLVL !== "L2" && setApprLvl("L1")}
                className="hidden"
              />
              {activeService?.REQAPPRLVL === "L2" && (
                <LockClosedIcon className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>
                Level 1 {activeService?.REQAPPRLVL === "L2" ? "(Locked for this service)" : "(L1 & L2 Approvers Eligible)"}
              </span>
            </label>

            <label
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${
                apprLvl === "L2"
                  ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <input
                type="radio"
                name="apprLvl"
                value="L2"
                checked={apprLvl === "L2"}
                onChange={() => setApprLvl("L2")}
                className="hidden"
              />
              <span>Level 2 (Senior / L2 Approvers Only)</span>
            </label>
          </div>
        </div>

        {/* Step 2: Specific Approver Officer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Step 2: Select Specific Approving Officer *
          </label>
          {approvers.length === 0 ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs rounded-xl border border-slate-200 dark:border-slate-700">
              No eligible approver officers found for classification {apprLvl}. Please contact Administrator.
            </div>
          ) : (
            <select
              value={selectedApproverId}
              onChange={(e) => setSelectedApproverId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition text-sm"
              required
            >
              {approvers.map((appr) => (
                <option key={appr.USERID} value={appr.USERID}>
                  {appr.FULLNAME} — {appr.DESIG || "Officer"} ({appr.DEPT || "Center"}) [Emp: {appr.EMPCODE} | Tier: {appr.APPRLVL}]
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-slate-400 mt-1.5">
            Self-approval is forbidden. The request will be assigned strictly to the selected officer.
          </p>
        </div>
      </div>

      {/* Section 4: Pricing Summary & Submit */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block mb-1">
            Official Amount Calculation
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-white font-mono">
              ₹{totalAmount.toFixed(2)}
            </span>
            <span className="text-xs text-slate-300">
              ({quantity} servings × ₹{grossUnitPrice.toFixed(2)} Food Rate)
              {flatHandlingCharge > 0 && ` + ₹${flatHandlingCharge.toFixed(2)} Flat Handling`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            * Formula: (Quantity × Gross Food Rate) + Flat Handling Fee. Official audit records are billed accordingly.
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !!cutoffWarning || !activeCombo}
          className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Submit Official Request</span>
              <SparklesIcon className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
