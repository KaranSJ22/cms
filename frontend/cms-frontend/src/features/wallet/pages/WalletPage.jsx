import { useState, useEffect, useCallback } from "react";
import {
  lookupCustomerForWallet,
  createWallet,
  fetchWallet,
  fetchWalletTransactions,
  topupWallet,
  fetchWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "../api/walletApi";
import { formatINR } from "../../../utils/formatters";

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState("withdrawals"); // 'withdrawals' | 'topup'

  // Top-Up / Customer Lookup State
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [customerWallet, setCustomerWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // New Wallet Opening State (First-time user)
  const [openAmount, setOpenAmount] = useState("0");
  const [openRemarks, setOpenRemarks] = useState("Initial wallet account creation");
  const [openingSubmitting, setOpeningSubmitting] = useState(false);

  // Top-Up Form State
  const [topupAmount, setTopupAmount] = useState("");
  const [topupRefNo, setTopupRefNo] = useState("");
  const [topupRemarks, setTopupRemarks] = useState("");
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(null);

  // Withdrawals List State
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id being approved/rejected
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadWithdrawals = useCallback(async () => {
    setFeedbackMsg(null);
    try {
      const data = await fetchWithdrawals({ status: "REQ" });
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load withdrawals", err);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  // Load pending withdrawal requests on mount or when tab changes
  useEffect(() => {
    if (activeTab === "withdrawals") {
      loadWithdrawals();
    }
  }, [activeTab, loadWithdrawals]);

  // Look up customer & wallet
  const handleLookupWallet = async (e) => {
    e?.preventDefault();
    if (!lookupId.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setTopupSuccess(null);
    setLookupResult(null);
    setCustomerWallet(null);
    setWalletTransactions([]);

    try {
      const result = await lookupCustomerForWallet(lookupId.trim());
      setLookupResult(result);

      if (result.hasWallet && result.wallet) {
        setCustomerWallet(result.wallet);
        // Fetch recent transactions
        const txns = await fetchWalletTransactions(lookupId.trim()).catch(() => []);
        setWalletTransactions(Array.isArray(txns) ? txns : []);
      }
    } catch (err) {
      setLookupError(
        err.response?.data?.message ||
          "Customer not found. Please enter a valid Customer ID."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle first-time wallet creation & activation
  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!lookupResult?.customer?.CUSTOMERID) return;
    const amountNum = Number(openAmount || 0);
    if (amountNum > 0 && amountNum < 100) {
      setLookupError("Opening deposit must be at least ₹100 if depositing opening cash (or ₹0 to create empty wallet).");
      return;
    }

    setOpeningSubmitting(true);
    setLookupError(null);
    setTopupSuccess(null);

    try {
      const newWallet = await createWallet({
        customerId: lookupResult.customer.CUSTOMERID,
        openAmount: amountNum,
        remarks: openRemarks.trim() || (amountNum === 0 ? "Initial 0-balance wallet creation" : "Initial cash opening deposit"),
      });

      setCustomerWallet(newWallet);
      setLookupResult((prev) => (prev ? { ...prev, hasWallet: true, wallet: newWallet } : prev));
      setTopupSuccess(
        amountNum > 0
          ? `Successfully activated wallet with ${formatINR(amountNum)} opening credit!`
          : `Successfully created wallet with ₹0 balance!`
      );

      // Refresh transactions
      const txns = await fetchWalletTransactions(lookupResult.customer.CUSTOMERID).catch(() => []);
      setWalletTransactions(Array.isArray(txns) ? txns : []);
    } catch (err) {
      setLookupError(err.response?.data?.message || "Failed to create wallet.");
    } finally {
      setOpeningSubmitting(false);
    }
  };

  // Handle cash top-up
  const handleTopup = async (e) => {
    e.preventDefault();
    const amountNum = Number(topupAmount);
    if (!customerWallet || !amountNum || amountNum < 100) {
      setLookupError("Top-up amount must be at least ₹100.00");
      return;
    }

    setTopupSubmitting(true);
    setTopupSuccess(null);
    setLookupError(null);

    try {
      await topupWallet({
        customerId: customerWallet.CUSTOMERID,
        amount: amountNum,
        paymentMethod: "CASH",
        refNo: topupRefNo.trim() || undefined,
        remarks: topupRemarks.trim() || "Cash top-up at canteen counter",
      });

      setTopupSuccess(`Successfully credited ${formatINR(amountNum)} cash to customer wallet!`);
      setTopupAmount("");
      setTopupRefNo("");
      setTopupRemarks("");

      // Refresh wallet & transactions
      const updatedWallet = await fetchWallet(customerWallet.CUSTOMERID);
      setCustomerWallet(updatedWallet);
      const txns = await fetchWalletTransactions(customerWallet.CUSTOMERID).catch(() => []);
      setWalletTransactions(Array.isArray(txns) ? txns : []);
    } catch (err) {
      setLookupError(err.response?.data?.message || "Failed to process top-up.");
    } finally {
      setTopupSubmitting(false);
    }
  };

  // Approve withdrawal
  const handleApprove = async (withdrawalId) => {
    setActionLoading(withdrawalId);
    setFeedbackMsg(null);
    try {
      await approveWithdrawal(withdrawalId);
      setFeedbackMsg({ type: "success", text: `Withdrawal request #${withdrawalId} approved and processed.` });
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
      setFeedbackMsg({ type: "success", text: `Withdrawal request #${withdrawalId} rejected.` });
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

  return (
    <div className="flex-1 bg-slate-50 p-6 md:p-8 space-y-8 font-inter overflow-y-auto">
      {/* ── Header ── */}
      <div className="bg-[#0F172A] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>

            <h1 className="text-2xl md:text-3xl font-black font-grotesk mt-2 tracking-tight">
              Canteen Wallet Console
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Cash top-ups, balance oversight, and withdrawal approvals for Contract Employees & Visitors.
            </p>
          </div>

          {/* Navigation Pill Buttons */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 gap-1">
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "withdrawals"
                  ? "bg-orange-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pending Withdrawals {withdrawals.length > 0 && `(${withdrawals.length})`}
            </button>
            <button
              onClick={() => setActiveTab("topup")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "topup"
                  ? "bg-orange-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cash Top-Up & Lookup
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab 1: Pending Withdrawals ── */}
      {activeTab === "withdrawals" && (
        <div className="space-y-6">
          {feedbackMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border ${
                feedbackMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-grotesk">
                  Contract Employee Cash Withdrawal Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Review and disburse cash withdrawals requested by contract staff upon resignation/settlement.
                </p>
              </div>
              <button
                onClick={loadWithdrawals}
                disabled={withdrawalsLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                Refresh
              </button>
            </div>

            {withdrawalsLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading withdrawal requests...</div>
            ) : withdrawals.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                No pending withdrawal requests found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Req ID</th>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Requested Amount</th>
                      <th className="p-3.5">Requested On</th>
                      <th className="p-3.5">Remarks</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawals.map((w) => {
                      const wid = w.WALLETWDID || w.WITHDRAWID;
                      const isActing = actionLoading === wid;
                      return (
                        <tr key={wid} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900">#{wid}</td>
                          <td className="p-3.5 font-bold text-slate-800">
                            {w.CUSTOMERNAME || w.DISPNAME || `Customer #${w.CUSTOMERID}`}
                          </td>
                          <td className="p-3.5 font-mono font-black text-rose-600">
                            {formatINR(w.AMOUNT || w.WITHDRAWAMT)}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono">
                            {w.CREATEDAT ? new Date(w.CREATEDAT).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-3.5 text-slate-600 max-w-xs truncate">{w.REMARKS || "—"}</td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleApprove(wid)}
                              disabled={isActing}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm disabled:opacity-50"
                            >
                              {isActing ? "Processing..." : "Approve & Pay"}
                            </button>
                            <button
                              onClick={() => setRejectingId(wid)}
                              disabled={isActing}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rejection Modal */}
          {rejectingId && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
                <h3 className="text-base font-bold text-slate-900">Reject Withdrawal Request #{rejectingId}</h3>
                <p className="text-xs text-slate-500">Please provide a reason for rejecting this cash withdrawal.</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (e.g. Unverified identity, dispute in balance)"
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setRejectingId(null);
                      setRejectReason("");
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(rejectingId)}
                    disabled={!rejectReason.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Cash Top-Up & Lookup ── */}
      {activeTab === "topup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Lookup Form */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900 font-grotesk">Customer Lookup</h2>
              <p className="text-xs text-slate-500 mt-0.5">Find a contract employee or visitor by Customer ID to manage wallet.</p>
            </div>

            <form onSubmit={handleLookupWallet} className="space-y-3">
              <div>
                <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Customer ID
                </label>
                <input
                  type="text"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="e.g. 2 or 1001"
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading || !lookupId.trim()}
                className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-50"
              >
                {lookupLoading ? "Searching..." : "Lookup Customer"}
              </button>
            </form>

            {lookupError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-medium">
                {lookupError}
              </div>
            )}
            {topupSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                {topupSuccess}
              </div>
            )}

            {/* Customer & Wallet Info Card */}
            {lookupResult?.customer && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-widest text-orange-400">
                      {lookupResult.customer.CTYPENAME || (lookupResult.customer.CTYPECODE === "CNT" ? "Contract Employee" : lookupResult.customer.CTYPECODE === "VIS" ? "Visitor" : "Permanent Staff")}
                    </span>
                    <p className="text-lg font-bold">{lookupResult.customer.DISPNAME || `Customer #${lookupResult.customer.CUSTOMERID}`}</p>
                    <p className="text-xs text-slate-400 font-mono">ID: #{lookupResult.customer.CUSTOMERID}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[0.65rem] font-bold border ${
                      customerWallet
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : lookupResult.isPermanent
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {customerWallet ? "ACTIVE WALLET" : lookupResult.isPermanent ? "DIRECT BILLING" : "NO WALLET"}
                  </span>
                </div>

                {customerWallet ? (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Current Balance</span>
                    <p className="text-3xl font-black font-mono text-emerald-400">
                      {formatINR(customerWallet.AVAILABLEBALANCE ?? customerWallet.BALANCE)}
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-400">
                      {lookupResult.isPermanent
                        ? "Prepaid wallet not applicable for permanent employees."
                        : "Prepaid wallet is not yet opened for this customer."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Panel */}
          <div className="lg:col-span-2 space-y-6">
            {customerWallet ? (
              <>
                {/* Top-Up Form */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base font-black text-slate-900 font-grotesk">Process Cash Top-Up</h2>
                    <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Min ₹100.00
                    </span>
                  </div>
                  <form onSubmit={handleTopup} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Amount (₹) *
                        </label>
                        <input
                          type="number"
                          min="100"
                          step="1"
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          placeholder="Minimum 100"
                          className="w-full p-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          required
                        />
                        {/* Quick Top-up Amount Chips */}
                        <div className="flex gap-1.5 mt-2">
                          {[100, 200, 500, 1000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTopupAmount(String(amt))}
                              className="px-2.5 py-1 text-[0.65rem] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-mono"
                            >
                              +{amt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Receipt / Ref Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={topupRefNo}
                          onChange={(e) => setTopupRefNo(e.target.value)}
                          placeholder="e.g. REC-9921"
                          className="w-full p-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Remarks / Notes
                      </label>
                      <input
                        type="text"
                        value={topupRemarks}
                        onChange={(e) => setTopupRemarks(e.target.value)}
                        placeholder="Cash received at counter"
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={topupSubmitting || !topupAmount || Number(topupAmount) < 100}
                      className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {topupSubmitting ? "Crediting..." : `Credit ${topupAmount ? formatINR(topupAmount) : "Cash"} to Wallet`}
                    </button>
                  </form>
                </div>

                {/* Recent Transactions Ledger */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Recent Wallet Transactions</h3>
                  {walletTransactions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      No transaction history found for this wallet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Ref No</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Balance After</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {walletTransactions.map((tx, idx) => {
                            const isCredit = tx.TRANSTYPE === "CREDIT" || tx.TRANSTYPE === "REFUND";
                            const txnKey = tx.WALLETTRANID || tx.TRANID || idx;
                            return (
                              <tr key={txnKey} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono font-bold text-slate-800">{tx.REFNO || `#${txnKey}`}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${
                                      isCredit
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {tx.TRANSTYPE}
                                  </span>
                                </td>
                                <td className={`p-3 font-mono font-bold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                                  {isCredit ? "+" : "-"} {formatINR(tx.AMOUNT)}
                                </td>
                                <td className="p-3 font-mono text-slate-600">{formatINR(tx.BALAFTER)}</td>
                                <td className="p-3 text-slate-500 font-mono">
                                  {tx.CREATEDAT ? new Date(tx.CREATEDAT).toLocaleDateString() : "—"}
                                </td>
                                <td className="p-3 text-slate-500 max-w-xs truncate">{tx.REMARKS || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : lookupResult && !lookupResult.hasWallet && lookupResult.isEligible ? (
              /* Case 2: First-Time User - Wallet Activation Card */
              <div className="bg-white rounded-3xl border-2 border-emerald-500/20 shadow-md p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                    ✨
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 font-grotesk">
                      Activate & Open Prepaid Wallet
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Customer <strong>{lookupResult.customer.DISPNAME}</strong> (ID #{lookupResult.customer.CUSTOMERID}) is eligible for a Canteen Wallet. You can create the wallet with <strong>₹0 opening balance</strong> or deposit cash immediately (minimum ₹100).
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateWallet} className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Initial Opening Deposit (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={openAmount}
                        onChange={(e) => setOpenAmount(e.target.value)}
                        placeholder="0 for zero balance, or ≥ 100"
                        className="w-full p-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <div className="flex gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setOpenAmount("0")}
                          className={`px-2 py-0.5 text-[0.65rem] font-bold rounded ${
                            openAmount === "0" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          ₹0 (Zero Balance)
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenAmount("100")}
                          className={`px-2 py-0.5 text-[0.65rem] font-bold rounded ${
                            openAmount === "100" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          ₹100
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenAmount("500")}
                          className={`px-2 py-0.5 text-[0.65rem] font-bold rounded ${
                            openAmount === "500" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          ₹500
                        </button>
                      </div>
                      <p className="text-[0.65rem] text-slate-400 mt-1">Leave 0 for empty wallet, or enter minimum ₹100 for cash opening.</p>
                    </div>

                    <div>
                      <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Remarks / Reference
                      </label>
                      <input
                        type="text"
                        value={openRemarks}
                        onChange={(e) => setOpenRemarks(e.target.value)}
                        placeholder="e.g. Initial account opening"
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={openingSubmitting || (Number(openAmount) > 0 && Number(openAmount) < 100)}
                    className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {openingSubmitting ? (
                      "Creating Wallet..."
                    ) : (
                      <>
                        <span>Create Wallet ({Number(openAmount) > 0 ? formatINR(openAmount) : "₹0 Balance"})</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : lookupResult?.isPermanent ? (
              /* Case 3: Permanent Employee Info Card */
              <div className="bg-white rounded-3xl border border-blue-200 shadow-sm p-8 text-center text-slate-600 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
                  ℹ️
                </div>
                <h3 className="text-base font-black text-slate-900 font-grotesk">Permanent Employee Account</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Customer <strong>{lookupResult.customer.DISPNAME}</strong> (ID #{lookupResult.customer.CUSTOMERID}) is a Permanent Employee. Permanent staff do not maintain prepaid wallets; their meal reservations are settled directly through institutional billing.
                </p>
              </div>
            ) : (
              /* Case 4: Empty State */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 space-y-2">
                <p className="text-base font-bold text-slate-700">No Customer Selected</p>
                <p className="text-xs max-w-sm mx-auto">
                  Look up a Contract Employee or Visitor Customer ID on the left to activate their wallet, add cash credit, or view transaction records.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
