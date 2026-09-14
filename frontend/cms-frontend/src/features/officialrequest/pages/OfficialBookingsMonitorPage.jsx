import { useState, useEffect } from "react";
import api from "../../../config/axios";
import { useAuth } from "../../../hooks/useAuth";
import {
  getManagerPendingBookings,
  processManagerAction,
} from "../api/officialApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  InboxIcon,
  CurrencyRupeeIcon,
} from "@heroicons/react/24/outline";

export default function OfficialBookingsMonitorPage() {
  const { user, activeCanteenId, setActiveCanteenId } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState(activeCanteenId || "");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionModal, setActionModal] = useState(null); // { booking, type: 'ACCEPT' | 'REJECT' }
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

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

  // 2. Fetch Pending Bookings
  const loadPending = async () => {
    if (!selectedCanteenId) return;
    try {
      setLoading(true);
      const data = await getManagerPendingBookings(selectedCanteenId);
      setRequests(data || []);
    } catch (err) {
      console.error("Failed to load manager pending bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, [selectedCanteenId]);

  const handleAction = async () => {
    if (!actionModal) return;
    const { booking, type } = actionModal;

    if (type === "REJECT" && !rejectReason.trim()) {
      alert("Please provide a reason for rejecting the booking");
      return;
    }

    try {
      setSubmitting(true);
      await processManagerAction(
        booking.OFFBOOKID,
        type,
        type === "REJECT" ? rejectReason.trim() : null
      );
      setFeedback({
        type: "success",
        message: `Booking ${booking.BOOKNO} successfully ${type === "ACCEPT" ? "confirmed" : "rejected"}.`,
      });
      setActionModal(null);
      setRejectReason("");
      loadPending();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.MESSAGE || err.message || "Action failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Official Bookings Monitor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review requests approved by departmental officers and provide final canteen confirmation.
          </p>
        </div>

        <select
          value={selectedCanteenId}
          onChange={(e) => {
            const val = Number(e.target.value);
            setSelectedCanteenId(val);
            setActiveCanteenId(val);
          }}
          className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
        >
          {canteens.map((c) => (
            <option key={c.CANTEENID} value={c.CANTEENID} className="bg-slate-900 text-white">
              {c.CANTEENNAME} ({c.CANTEENCODE})
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Requests Queue */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <InboxIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No pending official requests
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            All requests approved by officers have been processed for this canteen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.OFFBOOKID}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                    {r.BOOKNO}
                  </span>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {r.SERVNAME} • {r.COMBONAME}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    Approved by {r.APPROVER_NAME}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {r.PURPOSE}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4 text-slate-400" />
                    <span>{new Date(r.EVENTDATETIME).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="w-4 h-4 text-slate-400" />
                    <span>{r.VENUE}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>
                      Requester: {r.REQUESTER_NAME} ({r.REQUESTER_DEPT || "Center"})
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Catering Requirement:
                  </span>{" "}
                  {r.QUANTITY} servings for {r.NOOFPEOPLE} attendees.
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800 gap-4">
                <div className="text-left lg:text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                    Total Amount
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    ₹{Number(r.TOTALAMOUNT).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setActionModal({ booking: r, type: "ACCEPT" })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Accept (Confirm)</span>
                  </button>

                  <button
                    onClick={() =>
                      setActionModal({ booking: r, type: "REJECT" })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {actionModal.type === "ACCEPT" ? "Confirm Official Booking" : "Reject Official Booking"}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Booking: <span className="font-bold text-slate-700 dark:text-slate-300">{actionModal.booking.BOOKNO}</span> ({actionModal.booking.PURPOSE})
            </p>

            {actionModal.type === "ACCEPT" ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Are you sure you want to accept this official catering booking? The status will transition to <strong>CONFIRMED</strong> and the kitchen will be scheduled for delivery.
              </p>
            ) : (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Kitchen at maximum capacity on this date / Ingredients unavailable"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg cursor-pointer transition ${
                  actionModal.type === "ACCEPT"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submitting ? "Processing..." : actionModal.type === "ACCEPT" ? "Confirm Acceptance" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
