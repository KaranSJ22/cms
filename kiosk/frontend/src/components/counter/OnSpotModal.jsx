import React, { useState, useEffect, useRef, useMemo } from "react";
import { kioskApi } from "../../api/kioskApi";

export default function OnSpotModal({
  isOpen,
  onClose,
  canteenId,
  serviceId,
  staffToken,
  onSuccess,
}) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState(null);
  const [customer, setCustomer] = useState(null);

  const [menuLoading, setMenuLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Review confirmation step before dispensing
  const [isReviewing, setIsReviewing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerQuery("");
      setCustomer(null);
      setCustomerError(null);
      setMenuItems([]);
      setSelectedQuantities({});
      setSearchQuery("");
      setIsReviewing(false);
      setSubmitError(null);
      bufferRef.current = "";
    }
  }, [isOpen]);

  // Capture RFID badge scan via USB reader keystrokes (only in identify step)
  useEffect(() => {
    if (!isOpen || customer) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    const handleWindowKeyDown = (e) => {
      const now = Date.now();
      const isRapid = now - lastKeyTimeRef.current < 150;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const buffered = bufferRef.current.trim();
        const inputVal = (inputRef.current?.value || "").trim();
        const targetVal = (buffered.length >= 2 ? buffered : inputVal).toUpperCase();
        bufferRef.current = "";

        if (targetVal.length >= 2) {
          e.preventDefault();
          setCustomerQuery(targetVal);
          performLookup(targetVal);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (isRapid || bufferRef.current.length === 0) {
          bufferRef.current += e.key;
        } else {
          bufferRef.current = e.key;
        }
      }
    };

    const handlePointerDown = (e) => {
      // Keep input focused when tapping modal backdrop or empty area
      if (inputRef.current && !e.target.closest("button") && document.activeElement !== inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, customer]);

  // Step 1: Customer Lookup (Reusable for RFID Card Tap or Manual Submit)
  const performLookup = async (queryStr) => {
    const clean = (queryStr || "").trim();
    if (!clean) return;

    setCustomerLoading(true);
    setCustomerError(null);
    setCustomer(null);
    setMenuItems([]);
    setSelectedQuantities({});
    setSearchQuery("");
    setIsReviewing(false);

    try {
      const res = await kioskApi.counterWalkinCustomer({ query: clean }, staffToken);
      const data = res.data?.DATA || res.data;
      if (!data || !data.customerId) {
        throw new Error(`Customer with ID / Card "${clean}" not found`);
      }
      setCustomer(data);

      // Immediately fetch menu with dynamic pricing for this customer tier
      loadMenu(data.ctypeCode || "PRM");
    } catch (err) {
      const msg = err.response?.data?.MESSAGE || err.message || `Customer "${clean}" not found`;
      setCustomerError(msg);
      setTimeout(() => inputRef.current?.focus(), 150);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleLookupCustomer = async (e) => {
    if (e) e.preventDefault();
    await performLookup(customerQuery);
  };

  // Step 2: Load Active Menu with Tiered Prices
  const loadMenu = async (ctypeCode) => {
    setMenuLoading(true);
    try {
      const res = await kioskApi.counterWalkinMenu(
        { canteenId: canteenId || 1, ctypeCode },
        staffToken
      );
      const items = res.data?.DATA || res.data || [];
      setMenuItems(items);

      // Pre-select 1 portion of base meal if available
      const initial = {};
      const baseDish = items.find((m) => m.isBase) || items[0];
      if (baseDish) {
        initial[baseDish.dayMenuId] = 1;
      }
      setSelectedQuantities(initial);
    } catch (err) {
      setCustomerError("Failed to load today's menu dishes");
    } finally {
      setMenuLoading(false);
    }
  };

  const handleQuantityChange = (dayMenuId, delta) => {
    setSelectedQuantities((prev) => {
      const current = prev[dayMenuId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[dayMenuId];
        return copy;
      }
      return { ...prev, [dayMenuId]: next };
    });
  };

  // Filtered menu items based on staff search
  const filteredMenuItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter(
      (m) =>
        (m.itemName && m.itemName.toLowerCase().includes(q)) ||
        (m.shortName && m.shortName.toLowerCase().includes(q))
    );
  }, [menuItems, searchQuery]);

  // Calculate order total
  const orderItemsList = useMemo(() => {
    return Object.entries(selectedQuantities).map(([dmId, qty]) => {
      const dish = menuItems.find((m) => String(m.dayMenuId) === String(dmId));
      const rate = dish ? Number(dish.price || 0) : 0;
      return {
        dayMenuId: Number(dmId),
        itemName: dish?.itemName || "Item",
        isBase: Boolean(dish?.isBase),
        isSpecial: Boolean(dish?.isSpecial),
        qty,
        rate,
        amount: rate * qty,
      };
    });
  }, [selectedQuantities, menuItems]);

  const totalAmount = useMemo(
    () => orderItemsList.reduce((acc, it) => acc + it.amount, 0),
    [orderItemsList]
  );
  const totalQty = useMemo(
    () => orderItemsList.reduce((acc, it) => acc + it.qty, 0),
    [orderItemsList]
  );

  const isContractorOrVisitor = customer?.ctypeCode === "CNT" || customer?.ctypeCode === "VIS";
  const walletBalance = Number(customer?.walletBalance || 0);
  const hasInsufficientWallet = isContractorOrVisitor && totalAmount > walletBalance;

  // Step 3: Instant On-Spot Serve
  const handleConfirmServe = async () => {
    if (!customer?.customerId || totalQty === 0) return;
    if (hasInsufficientWallet) {
      setSubmitError(
        `Insufficient wallet balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${walletBalance.toFixed(2)}`
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        customerId: customer.customerId,
        canteenId: canteenId || 1,
        serviceId: menuItems[0]?.serviceId || serviceId || 2,
        items: orderItemsList.map((it) => ({
          dayMenuId: it.dayMenuId,
          qty: it.qty,
        })),
      };

      const res = await kioskApi.counterWalkinServe(payload, staffToken);
      const data = res.data?.DATA || res.data;

      onClose();

      if (typeof onSuccess === "function") {
        try {
          onSuccess({
            bookNo: data?.bookNo || "WI-ONSPOT",
            customerName: customer.dispName,
            totalAmount,
            walletDeducted: isContractorOrVisitor ? totalAmount : 0,
          });
        } catch (callbackErr) {
          console.warn("Error running onSuccess callback:", callbackErr);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.MESSAGE || err.message || "Failed to dispense on-spot food";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Crucial guard: do not render modal when closed
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col h-[92vh] max-h-[94vh] overflow-hidden">
        
        {/* Modal Header (Fixed) */}
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center text-xl shadow-md shadow-amber-500/20 shrink-0">
              🍲
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-white font-grotesk tracking-tight leading-tight">
                {isReviewing ? "Confirm On-Spot Dispensing" : "On-Spot Surplus Food Dispensing"}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {isReviewing
                  ? "Verify order summary before deducting wallet & dispensing"
                  : "Staff-verified surplus food serving • No pre-booking required"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg transition-colors cursor-pointer active:scale-95 shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: Customer Lookup Form (When customer NOT yet identified) */}
        {!customer && (
          <div className="py-4 flex-1 min-h-0 overflow-y-auto kiosk-scrollbar space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Step 1: Identify Customer (Tap Card or Type ID)
            </label>
            <form onSubmit={handleLookupCustomer} className="flex gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target.value || bufferRef.current || customerQuery || "").trim().toUpperCase();
                    if (val.length >= 2) {
                      bufferRef.current = "";
                      setCustomerQuery(val);
                      performLookup(val);
                    }
                  }
                }}
                placeholder="Scan RFID badge or type EmpCode / Phone..."
                autoFocus
                className="flex-1 px-4 py-3 bg-slate-950 border-2 border-slate-700 focus:border-amber-500 rounded-2xl text-white font-mono text-base placeholder:text-slate-600 outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={customerLoading || !customerQuery.trim()}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {customerLoading ? "Searching..." : "Identify ➔"}
              </button>
            </form>

            {customerError && (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-bold font-mono">
                {customerError}
              </div>
            )}

            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2 mt-4">
              <div className="text-3xl">💳</div>
              <div className="text-sm font-bold text-slate-200 font-grotesk">
                RFID Reader Ready
              </div>
              <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto">
                Place an employee or visitor card on the USB RFID scanner to immediately load profile and pricing.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Menu Selection & Search (When customer IS identified and NOT in review) */}
        {customer && !isReviewing && (
          <div className="py-3 flex-1 min-h-0 flex flex-col gap-2.5">
            
            {/* Compact Customer Strip (Fixed Header) */}
            <div className="shrink-0 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                  {customer.dispName ? customer.dispName[0].toUpperCase() : "C"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-grotesk">
                      {customer.dispName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {customer.ctypeName || customer.ctypeCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {customer.loginId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isContractorOrVisitor && (
                  <div className="text-right">
                    <div className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">
                      Wallet
                    </div>
                    <div
                      className={`text-sm font-black font-mono ${
                        walletBalance < totalAmount ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      ₹{walletBalance.toFixed(2)}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCustomer(null);
                    setCustomerQuery("");
                    setMenuItems([]);
                    setSelectedQuantities({});
                    setSearchQuery("");
                    setIsReviewing(false);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold font-mono transition-colors cursor-pointer border border-slate-700"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Search Bar & Tier Indicator (Fixed Subheader) */}
            <div className="shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-sm">
                  🔍
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes (e.g. Thali, Rice, Roti)..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-white font-mono text-xs placeholder:text-slate-500 outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                {customer.ctypeCode === "PRM" ? "Permanent Tier" : "Commercial Tier"}
              </div>
            </div>

            {/* Dedicated Dishes Scroll Area (Fills entire remaining height) */}
            <div className="flex-1 min-h-0 overflow-y-auto kiosk-scrollbar pr-1.5 space-y-2">
              {menuLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">
                  Loading active slot dishes...
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs bg-slate-950/50 rounded-2xl border border-slate-800">
                  {menuItems.length === 0
                    ? "No published menu items available for this meal slot."
                    : "No dishes match your search query."}
                  {searchQuery && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-amber-400 text-xs underline font-bold cursor-pointer"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredMenuItems.map((dish) => {
                  const qty = selectedQuantities[dish.dayMenuId] || 0;
                  return (
                    <div
                      key={dish.dayMenuId}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        qty > 0
                          ? "bg-slate-950/95 border-amber-500/60 shadow-md ring-1 ring-amber-500/30"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>{dish.itemName}</span>
                          {dish.isBase && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Base
                            </span>
                          )}
                          {dish.isSpecial && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Special
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          {Number(dish.price) > 0
                            ? `₹${Number(dish.price).toFixed(2)}`
                            : "Subsidised (₹0.00)"}
                        </div>
                      </div>

                      {/* Tactile 38x38px touch buttons */}
                      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(dish.dayMenuId, -1)}
                          disabled={qty === 0}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-base disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-all"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-mono font-black text-sm text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(dish.dayMenuId, 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base cursor-pointer active:scale-90 transition-all shadow"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {submitError && (
              <div className="shrink-0 p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs text-center font-bold font-mono">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Order Review View (When customer IS identified and in review mode) */}
        {customer && isReviewing && (
          <div className="py-3 flex-1 min-h-0 flex flex-col gap-3">
            
            {/* Customer Strip */}
            <div className="shrink-0 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  {customer.dispName ? customer.dispName[0].toUpperCase() : "C"}
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-grotesk">
                    {customer.dispName} ({customer.ctypeName || customer.ctypeCode})
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">ID: {customer.loginId}</div>
                </div>
              </div>
            </div>

            {/* Scrollable Summary Card */}
            <div className="flex-1 min-h-0 overflow-y-auto kiosk-scrollbar pr-1.5 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Order Summary Review
                </div>

                <div className="divide-y divide-slate-800/80">
                  {orderItemsList.map((item, idx) => (
                    <div
                      key={item.dayMenuId}
                      className="py-2 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 text-white">
                        <span className="text-slate-500">{idx + 1}.</span>
                        <span className="font-bold">{item.itemName}</span>
                        {item.isBase && (
                          <span className="text-[9px] px-1 bg-blue-500/20 text-blue-300 rounded">
                            Base
                          </span>
                        )}
                      </div>
                      <div className="text-right text-slate-300">
                        <span>
                          {item.qty} × ₹{item.rate.toFixed(2)} ={" "}
                        </span>
                        <span className="font-bold text-emerald-400">
                          ₹{item.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white uppercase">Grand Total ({totalQty} items)</span>
                  <span className="text-base font-black text-emerald-400">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>

                {isContractorOrVisitor ? (
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">
                      Wallet: ₹{walletBalance.toFixed(2)} ➔ After Dispense:
                    </span>
                    <span
                      className={`font-black ${
                        walletBalance - totalAmount < 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      ₹{Math.max(0, walletBalance - totalAmount).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="pt-1.5 text-[11px] font-mono text-emerald-400/90 text-right">
                    ✓ Subsidized meal benefit applied (No wallet debit)
                  </div>
                )}
              </div>

              {hasInsufficientWallet && (
                <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-bold font-mono text-center">
                  ⚠️ Insufficient wallet balance for this customer.
                </div>
              )}

              {submitError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs text-center font-bold font-mono">
                  {submitError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer (Fixed Actions) */}
        {customer && (
          <div className="pt-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Total Items: {totalQty}
              </div>
              <div className="text-lg font-black text-white font-grotesk">
                Total: <span className="text-emerald-400 font-mono">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {!isReviewing ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer active:scale-95 border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReviewing(true)}
                    disabled={totalQty === 0 || hasInsufficientWallet}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Review Order ({totalQty}) ➔</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsReviewing(false)}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer active:scale-95 border border-slate-700"
                  >
                    ← Back / Modify
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmServe}
                    disabled={submitting || totalQty === 0 || hasInsufficientWallet}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Dispensing...</span>
                    ) : (
                      <span>Confirm & Dispense Now ✓</span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
