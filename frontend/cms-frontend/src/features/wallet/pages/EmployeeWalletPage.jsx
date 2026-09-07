import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
import {
  fetchWallet,
  fetchWalletTransactions,
  requestWithdrawal,
  fetchWithdrawals,
} from "../api/walletApi";
import { formatINR } from "../../../utils/formatters";

export default function EmployeeWalletPage() {
  const { customer } = useAuth();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [myWithdrawals, setMyWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal modal state
  const [isWdModalOpen, setIsWdModalOpen] = useState(false);
  const [wdAmount, setWdAmount] = useState("");
  const [wdRemarks, setWdRemarks] = useState("");
  const [submittingWd, setSubmittingWd] = useState(false);
  const [wdFeedback, setWdFeedback] = useState(null);

  const isEligibleCustomer =
    customer?.CTYPECODE === "CNT" ||
    customer?.CTYPECODE === "CONTEMP" ||
    customer?.CTYPECODE === "VIS" ||
    customer?.CTYPECODE === "VISITOR";

  const loadWalletData = useCallback(async () => {
    if (!customer?.CUSTOMERID) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [walletRes, txnsRes, wdRes] = await Promise.all([
        fetchWallet(customer.CUSTOMERID).catch(() => null),
        fetchWalletTransactions(customer.CUSTOMERID).catch(() => []),
        fetchWithdrawals({ customerId: customer.CUSTOMERID }).catch(() => []),
      ]);

      setWallet(walletRes);
      setTransactions(Array.isArray(txnsRes) ? txnsRes : []);
      setMyWithdrawals(Array.isArray(wdRes) ? wdRes : []);
    } catch (err) {
      console.error("Failed to load employee wallet", err);
    } finally {
      setLoading(false);
    }
  }, [customer?.CUSTOMERID]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    if (!wdAmount || Number(wdAmount) <= 0) return;

    const available = Number(wallet?.AVAILABLEBALANCE ?? wallet?.BALANCE ?? 0);
    if (Number(wdAmount) > available) {
      setWdFeedback({
        type: "error",
        text: `Requested amount cannot exceed your available balance of ${formatINR(available)}.`,
      });
      return;
    }

    setSubmittingWd(true);
    setWdFeedback(null);

    try {
      await requestWithdrawal({
        customerId: customer.CUSTOMERID,
        amount: Number(wdAmount),
        remarks: wdRemarks.trim() || "Customer withdrawal request",
      });

      setWdFeedback({
        type: "success",
        text: "Withdrawal request submitted successfully! Awaiting canteen manager approval.",
      });
      setWdAmount("");
      setWdRemarks("");
      loadWalletData();
    } catch (err) {
      setWdFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to submit withdrawal request.",
      });
    } finally {
      setSubmittingWd(false);
    }
  };

  if (!isEligibleCustomer) {
    return (
      <div className="flex-1 bg-slate-50 p-8 flex items-center justify-center font-inter">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            ℹ️
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-grotesk">Wallet Not Required</h2>
          <p className="text-xs text-slate-500">
            As a Permanent Employee, you do not require a canteen prepaid wallet. Your meal reservations are billed directly through payroll/institutional billing.
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !wallet) {
    return (
      <div className="flex-1 bg-slate-50 p-6 md:p-8 space-y-8 font-inter overflow-y-auto">
        <div className="bg-[#0F172A] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 font-grotesk tracking-wide">
              PREPAID CANTEEN ACCOUNT
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-grotesk mt-2 tracking-tight">
              My Wallet & Statement
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Check your available meal credits, audit recent transactions, or submit cash withdrawal requests.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 max-w-xl mx-auto text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-3xl">
            💳
          </div>
          <h2 className="text-xl font-black text-slate-900 font-grotesk">
            Wallet Not Yet Activated
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            Your Canteen Prepaid Wallet has not been opened yet. Please visit the canteen cashier counter to open and activate your wallet (with ₹0 balance or initial cash top-up).
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 font-mono inline-block">
            Customer ID: <strong className="text-slate-900">#{customer?.CUSTOMERID}</strong> | Name: <strong className="text-slate-900">{customer?.DISPNAME}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-6 md:p-8 space-y-8 font-inter overflow-y-auto">
      {/* ── Header ── */}
      <div className="bg-[#0F172A] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 font-grotesk tracking-wide">
              PREPAID CANTEEN ACCOUNT
            </span>
            <h1 className="text-2xl md:text-3xl font-black font-grotesk mt-2 tracking-tight">
              My Wallet & Statement
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Check your available meal credits, audit recent transactions, or submit cash withdrawal requests.
            </p>
          </div>

          <button
            onClick={() => {
              setIsWdModalOpen(true);
              setWdFeedback(null);
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Request Cash Withdrawal
          </button>
        </div>
      </div>

      {/* ── Balance Overview Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Balance</span>
          <p className="text-4xl font-black text-emerald-600 font-mono">
            {loading ? "—" : formatINR(wallet?.AVAILABLEBALANCE ?? wallet?.BALANCE ?? 0)}
          </p>
          <p className="text-xs text-slate-500">Usable for upcoming meal pre-bookings</p>
        </div>

        {/* Reserved Amount */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reserved / Locked</span>
          <p className="text-4xl font-black text-slate-700 font-mono">
            {loading ? "—" : formatINR(wallet?.RESERVEDAMT ?? 0)}
          </p>
          <p className="text-xs text-slate-500">Committed to active meal bookings</p>
        </div>

        {/* Account Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prepaid Status</span>
          <div className="pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
              {wallet?.STATUSCODE || "ACTIVE"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Cash top-ups available at canteen cashier</p>
        </div>
      </div>

      {/* ── My Withdrawal Requests (if any) ── */}
      {myWithdrawals.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-black text-slate-900 font-grotesk">My Cash Withdrawal Requests</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Req ID</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Requested On</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myWithdrawals.map((w, idx) => {
                  const wid = w.WALLETWDID || w.WITHDRAWID || idx;
                  const isPending = w.STATUSCODE === "REQ" || w.STATUSID === 50 || w.STATUSID === 40;
                  const isApproved = w.STATUSCODE === "COM" || w.STATUSID === 51 || w.STATUSID === 10;
                  return (
                    <tr key={wid} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">#{wid}</td>
                      <td className="p-3.5 font-mono font-black text-rose-600">
                        {formatINR(w.AMOUNT || w.WITHDRAWAMT)}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {w.CREATEDAT || w.REQUESTEDAT ? new Date(w.CREATEDAT || w.REQUESTEDAT).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isPending
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isApproved ? "Approved / Paid" : isPending ? "Pending Review" : "Rejected"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{w.REMARKS || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Transaction Ledger Statement ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900 font-grotesk">Transaction Statement</h2>
            <p className="text-xs text-slate-500">History of cash deposits, meal booking debits, and refunds.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading transaction history...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Txn Ref</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Balance After</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx, idx) => {
                  const isCredit = tx.TRANSTYPE === "CREDIT" || tx.TRANSTYPE === "REFUND";
                  const txnKey = tx.WALLETTRANID || tx.TRANID || idx;
                  return (
                    <tr key={txnKey} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{tx.REFNO || `#${txnKey}`}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold ${
                            isCredit
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {tx.TRANSTYPE}
                        </span>
                      </td>
                      <td className={`p-3.5 font-mono font-bold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                        {isCredit ? "+" : "-"} {formatINR(tx.AMOUNT)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-700">{formatINR(tx.BALAFTER)}</td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {tx.CREATEDAT ? new Date(tx.CREATEDAT).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{tx.REMARKS || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Withdrawal Request Modal ── */}
      {isWdModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 font-grotesk">Request Cash Withdrawal</h3>
              <button
                onClick={() => setIsWdModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Submit a request to withdraw unspent wallet balance in cash. Once approved by the canteen manager, collect cash at the counter.
            </p>

            {wdFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  wdFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {wdFeedback.text}
              </div>
            )}

            <form onSubmit={handleRequestWithdrawal} className="space-y-4 pt-2">
              <div>
                <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Withdrawal Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={wallet?.AVAILABLEBALANCE ?? wallet?.BALANCE ?? 0}
                  value={wdAmount}
                  onChange={(e) => setWdAmount(e.target.value)}
                  placeholder={`Max: ${wallet?.AVAILABLEBALANCE ?? wallet?.BALANCE ?? 0}`}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Reason / Remarks
                </label>
                <input
                  type="text"
                  value={wdRemarks}
                  onChange={(e) => setWdRemarks(e.target.value)}
                  placeholder="e.g. Resignation settlement, cash refund"
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsWdModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingWd || !wdAmount}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submittingWd ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
