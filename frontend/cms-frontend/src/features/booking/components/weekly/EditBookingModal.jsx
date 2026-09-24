import { useState, useEffect, useCallback } from "react";
import Modal from "../../../../components/common/Modal";
import {
  getBooking,
  updateBookingItemsBatch,
} from "../../api/bookingApi";
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  InformationCircleIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";
import { getServiceEmoji } from "../../../../utils/serviceEmoji";

/**
 * Interactive Modal to view and live-edit pre-booked meal items.
 * Uses client-side staging so that modifying portion quantities, adding new dishes,
 * and removing items do NOT make chatty per-item API requests.
 * A single atomic batch request (CMSUPDBOOKITEM / CMSCANCELBOOK) is fired upon saving.
 */
export default function EditBookingModal({
  isOpen,
  onClose,
  modalData, // { bookingId, bookingNo, serviceId, servName, dateStr, displayDate, availableItems = [] }
  onBookingUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Original items from the database
  const [originalItems, setOriginalItems] = useState([]);
  // Staged in-memory items currently being edited
  const [stagedItems, setStagedItems] = useState([]);

  const bookingId = modalData?.bookingId;

  // Load fresh booking details with items
  const loadBookingDetails = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getBooking(bookingId);
      const active = (data?.ITEMS || [])
        .filter((i) => i.STATUSCODE === "CRT" || i.STATUSID === 30)
        .map((item) => ({
          dayMenuId: item.DAYMENUID,
          bookItemId: item.BOOKITEMID,
          itemName: item.ITEMNAME,
          isBase: item.ISBASE,
          rate: Number(item.RATE),
          qty: Number(item.QTY),
          maxQty: item.MAXQTY || 10,
        }));

      setOriginalItems(active);
      setStagedItems(active);
    } catch (err) {
      console.error("Failed to load booking details for editing", err);
      setError(
        err?.response?.data?.MESSAGE ||
          "Could not load booking details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
      setSuccessMsg("");
      setError("");
    } else {
      setOriginalItems([]);
      setStagedItems([]);
    }
  }, [isOpen, bookingId, loadBookingDetails]);

  // In-memory quantity stepper
  const handleUpdateQty = (dayMenuId, delta) => {
    setStagedItems((prev) =>
      prev.map((item) => {
        if (item.dayMenuId === dayMenuId) {
          const max = item.maxQty || 10;
          const newQty = Math.max(1, Math.min(max, item.qty + delta));
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  // In-memory removal
  const handleRemoveItem = (dayMenuId) => {
    setStagedItems((prev) => prev.filter((item) => item.dayMenuId !== dayMenuId));
  };

  // In-memory addition of available dish
  const handleAddDish = (dish) => {
    setStagedItems((prev) => [
      ...prev,
      {
        dayMenuId: dish.DAYMENUID,
        bookItemId: null,
        itemName: dish.ITEMNAME,
        isBase: dish.ISBASE,
        rate: Number(dish.DISPLAYPRICE || dish.PRICE || 0),
        qty: 1,
        maxQty: dish.MAXQTY || 10,
      },
    ]);
  };

  // Reset staged changes back to original
  const handleReset = () => {
    setStagedItems([...originalItems]);
    setError("");
  };

  // Financial calculations
  const originalTotal = originalItems.reduce(
    (sum, item) => sum + item.rate * item.qty,
    0
  );
  const stagedTotal = stagedItems.reduce(
    (sum, item) => sum + item.rate * item.qty,
    0
  );
  const delta = stagedTotal - originalTotal; // < 0 is refund, > 0 is charge

  // Detect whether any changes have been made
  const hasChanges =
    JSON.stringify(
      stagedItems.map((i) => ({ id: i.dayMenuId, q: i.qty })).sort((a, b) => a.id - b.id)
    ) !==
    JSON.stringify(
      originalItems.map((i) => ({ id: i.dayMenuId, q: i.qty })).sort((a, b) => a.id - b.id)
    );

  // Atomic batch save & finalize
  const handleSaveChanges = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    if (stagedItems.length === 0) {
      if (
        !window.confirm(
          `You have removed all dishes. This will cancel this reservation and refund ${formatINR(
            originalTotal
          )} back to your wallet. Proceed?`
        )
      ) {
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = stagedItems.map((item) => ({
        dayMenuId: item.dayMenuId,
        qty: item.qty,
      }));

      await updateBookingItemsBatch(bookingId, payload);
      setSuccessMsg("Booking updated and wallet adjusted successfully!");

      onBookingUpdated?.();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to finalize booking updates", err);
      setError(
        err?.response?.data?.MESSAGE ||
          "Failed to update booking. Please check your wallet balance and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Available dishes from today's menu not currently staged
  const availableItems = modalData?.availableItems || [];
  const stagedDayMenuIds = new Set(stagedItems.map((i) => i.dayMenuId));
  const unbookedAvailableDishes = availableItems.filter(
    (dish) => !stagedDayMenuIds.has(dish.DAYMENUID)
  );

  const footer = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-3">
        <div className="text-xs">
          <span className="text-slate-400">Total Billed:</span>{" "}
          <span className="font-mono font-black text-slate-900 text-sm">
            {formatINR(stagedTotal)}
          </span>
          {hasChanges && (
            <span className="text-[10px] text-slate-400 ml-1">
              (was {formatINR(originalTotal)})
            </span>
          )}
        </div>

        {hasChanges && (
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
            title="Reset changes"
          >
            <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={saving || !hasChanges}
          className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
            stagedItems.length === 0
              ? "bg-rose-600 hover:bg-rose-700 text-white"
              : "bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40 disabled:pointer-events-none"
          }`}
        >
          {saving ? (
            <>
              <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : stagedItems.length === 0 ? (
            <span>Cancel Reservation (100% Refund)</span>
          ) : (
            <span>Save & Finalize ({formatINR(stagedTotal)})</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-lg">{getServiceEmoji(modalData?.servName)}</span>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-grotesk">
              Edit Pre-Booked Meal
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              {modalData?.servName} • {modalData?.displayDate}, 2026 (#{modalData?.bookingNo})
            </p>
          </div>
        </div>
      }
      maxWidth="max-w-lg"
      footer={footer}
    >
      <div className="space-y-4">
        {/* Status / Feedback Alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <InformationCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Financial / Wallet Impact Preview */}
        {hasChanges && (
          <div className="p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all">
            {delta < 0 ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/90 w-full p-2 rounded-lg border border-emerald-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{formatINR(Math.abs(delta))}</strong> will be credited directly back to your active wallet upon saving.
                </span>
              </div>
            ) : delta > 0 ? (
              <div className="flex items-center gap-2 text-amber-800 bg-amber-50/90 w-full p-2 rounded-lg border border-amber-200">
                <InformationCircleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{formatINR(delta)}</strong> additional will be debited from your active wallet balance upon saving.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-600 bg-slate-50 w-full p-2 rounded-lg border border-slate-200">
                <InformationCircleIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Dishes adjusted with identical total amount ({formatINR(stagedTotal)}).</span>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-xs font-medium">Loading booking dishes...</span>
          </div>
        ) : (
          <>
            {/* Section 1: Booked Dishes (Staged in local state) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Booked Dishes ({stagedItems.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Order #{modalData?.bookingNo}
                </span>
              </div>

              {stagedItems.length === 0 ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-1">
                  <p className="text-xs font-bold text-rose-800">
                    All dishes removed from this reservation!
                  </p>
                  <p className="text-[11px] text-rose-600">
                    Clicking &quot;Cancel Reservation&quot; will release this slot and refund {formatINR(originalTotal)} to your wallet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stagedItems.map((item) => {
                    return (
                      <div
                        key={item.dayMenuId}
                        className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {item.itemName}
                            </span>
                            {item.isBase === 1 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 border border-orange-200">
                                Base
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {formatINR(item.rate)} each • Subtotal:{" "}
                            <strong className="text-slate-800">
                              {formatINR(item.rate * item.qty)}
                            </strong>
                          </span>
                        </div>

                        {/* Quantity Stepper & Remove */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.dayMenuId, -1)}
                              disabled={saving || item.qty <= 1}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                              title="Decrease portion"
                            >
                              <MinusIcon className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black font-mono px-1.5 text-slate-900">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.dayMenuId, 1)}
                              disabled={saving || (item.maxQty && item.qty >= item.maxQty)}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                              title="Increase portion"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.dayMenuId)}
                            disabled={saving}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Remove this dish"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Add Available Dishes from Today's Published Menu */}
            {unbookedAvailableDishes.length > 0 && (
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <SparklesIcon className="w-3.5 h-3.5 text-orange-500" />
                    <span>Add More Dishes to this Meal</span>
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {unbookedAvailableDishes.map((dish) => {
                    return (
                      <div
                        key={dish.DAYMENUID}
                        className="p-2.5 bg-white border border-slate-200 hover:border-orange-300 rounded-xl flex items-center justify-between gap-3 transition-colors shadow-2xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {dish.ITEMNAME}
                            </span>
                            {dish.ISBASE === 1 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-800">
                                Base
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-600">
                            {formatINR(dish.DISPLAYPRICE || dish.PRICE || 0)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddDish(dish)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-lg border border-orange-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <PlusIcon className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
