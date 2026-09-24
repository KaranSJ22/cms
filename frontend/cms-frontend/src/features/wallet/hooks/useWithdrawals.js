import { useState, useCallback } from "react";
import {
  fetchWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "../api/walletApi";

/**
 * Custom hook to manage contract employee cash withdrawal requests,
 * approval disbursement, and rejection workflow.
 */
export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id being approved/rejected
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadWithdrawals = useCallback(async () => {
    setFeedbackMsg(null);
    setWithdrawalsLoading(true);
    try {
      const data = await fetchWithdrawals({ status: "REQ" });
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load withdrawals", err);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  // Approve withdrawal
  const handleApprove = async (withdrawalId) => {
    setActionLoading(withdrawalId);
    setFeedbackMsg(null);
    try {
      await approveWithdrawal(withdrawalId);
      setFeedbackMsg({
        type: "success",
        text: `Withdrawal request #${withdrawalId} approved and processed.`,
      });
      loadWithdrawals();
    } catch (err) {
      setFeedbackMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to approve withdrawal request.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Reject withdrawal
  const handleReject = async (withdrawalId) => {
    if (!rejectReason.trim()) return;

    setActionLoading(withdrawalId);
    setFeedbackMsg(null);
    try {
      await rejectWithdrawal(withdrawalId, { remarks: rejectReason.trim() });
      setFeedbackMsg({
        type: "success",
        text: `Withdrawal request #${withdrawalId} rejected.`,
      });
      setRejectingId(null);
      setRejectReason("");
      loadWithdrawals();
    } catch (err) {
      setFeedbackMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to reject withdrawal request.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return {
    withdrawals,
    withdrawalsLoading,
    actionLoading,
    rejectReason,
    setRejectReason,
    rejectingId,
    setRejectingId,
    feedbackMsg,
    setFeedbackMsg,
    loadWithdrawals,
    handleApprove,
    handleReject,
  };
}
