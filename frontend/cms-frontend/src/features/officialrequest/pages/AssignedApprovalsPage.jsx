import { useState, useEffect } from "react";
import {
  getAssignedApprovals,
  processApproverAction,
} from "../api/officialApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ExclamationCircleIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";

export default function AssignedApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // { booking, type: 'APPROVE' | 'REJECT' }
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getAssignedApprovals();
      setRequests(data || []);
    } catch (err) {
      console.error("Failed to load assigned approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async () => {
    if (!actionModal) return;
    const { booking, type } = actionModal;

    if (type === "REJECT" && !rejectReason.trim()) {
      alert("Please provide a reason for rejecting the booking");
      return;
    }

    try {
      setSubmitting(true);
      await processApproverAction(
        booking.OFFBOOKID,
        type,
        type === "REJECT" ? rejectReason.trim() : null
      );
      setFeedback({
        type: "success",
        message: `Booking ${booking.BOOKNO} successfully ${type === "APPROVE" ? "approved and forwarded to Canteen Manager" : "rejected"}.`,
      });
      setActionModal(null);
      setRejectReason("");
      loadRequests();
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
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Assigned Official Approvals
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and approve official catering requests assigned to you by permanent employees.
        </p>
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

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <InboxIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
            Inbox is clear
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            You currently have no official booking requests awaiting your approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.OFFBOOKID}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Request Info */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                    {r.BOOKNO}
                  </span>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {r.SERVNAME} • {r.COMBONAME}
                  </span>
                  <span className="text-xs text-slate-400">
                    (Catering: {r.CANTEENNAME})
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
                      Requester: {r.REQUESTER_NAME} ({r.REQUESTER_DESIG || "Officer"} - {r.REQUESTER_DEPT || "Center"})
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Order Volume:
                  </span>{" "}
                  {r.QUANTITY} billable portions for {r.NOOFPEOPLE} estimated attendees.
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800 gap-4">
                <div className="text-left lg:text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                    Calculated Total
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    ₹{Number(r.TOTALAMOUNT).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setActionModal({ booking: r, type: "APPROVE" })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Approve</span>
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

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              {actionModal.type === "APPROVE" ? (
                <>
                  <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                  <span>Approve Official Request</span>
                </>
              ) : (
                <>
                  <ExclamationCircleIcon className="w-6 h-6 text-rose-500" />
                  <span>Reject Official Request</span>
                </>
              )}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Booking: <span className="font-bold text-slate-700 dark:text-slate-300">{actionModal.booking.BOOKNO}</span> ({actionModal.booking.PURPOSE})
            </p>

            {actionModal.type === "APPROVE" ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Are you sure you want to approve this request? It will immediately proceed to the Canteen Manager for final operational confirmation.
              </p>
            ) : (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason * (Required for audit history)
                </label>
                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Budget not approved for this event / Date conflict / Reschedule required"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg cursor-pointer transition ${
                  actionModal.type === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submitting ? "Processing..." : actionModal.type === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
