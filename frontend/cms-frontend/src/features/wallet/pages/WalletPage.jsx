import { useState, useEffect } from "react";
import { useWalletLookup } from "../hooks/useWalletLookup";
import { useWithdrawals } from "../hooks/useWithdrawals";
import WithdrawalsFilterTabs from "../components/withdrawals/WithdrawalsFilterTabs";
import WithdrawalsTable from "../components/withdrawals/WithdrawalsTable";
import WithdrawalReviewModal from "../components/withdrawals/WithdrawalReviewModal";
import CustomerLookupCard from "../components/topup/CustomerLookupCard";
import RechargeForm from "../components/topup/RechargeForm";
import CustomerTxnLedger from "../components/topup/CustomerTxnLedger";
import WalletAccountCard from "../components/topup/WalletAccountCard";

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState("topup"); // 'topup' | 'withdrawals'

  const {
    lookupId,
    setLookupId,
    lookupResult,
    customerWallet,
    walletTransactions,
    txnPage,
    setTxnPage,
    txnPageSize,
    txnPagination,
    lookupLoading,
    lookupError,
    openAmount,
    setOpenAmount,
    openRemarks,
    setOpenRemarks,
    openingSubmitting,
    topupAmount,
    setTopupAmount,
    topupRefNo,
    setTopupRefNo,
    topupRemarks,
    setTopupRemarks,
    topupSubmitting,
    topupSuccess,
    loadTransactions,
    handleLookupWallet,
    handleCreateWallet,
    handleTopup,
  } = useWalletLookup();

  const {
    withdrawals,
    withdrawalsLoading,
    actionLoading,
    rejectReason,
    setRejectReason,
    rejectingId,
    setRejectingId,
    feedbackMsg,
    loadWithdrawals,
    handleApprove,
    handleReject,
  } = useWithdrawals();

  // Load pending withdrawal requests on mount to show badge count and on tab switch
  useEffect(() => {
    loadWithdrawals();
  }, [activeTab, loadWithdrawals]);

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
          <WithdrawalsFilterTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            withdrawalsCount={withdrawals.length}
          />
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

          <WithdrawalsTable
            withdrawals={withdrawals}
            withdrawalsLoading={withdrawalsLoading}
            loadWithdrawals={loadWithdrawals}
            actionLoading={actionLoading}
            handleApprove={handleApprove}
            setRejectingId={setRejectingId}
          />

          {/* Rejection Modal */}
          <WithdrawalReviewModal
            rejectingId={rejectingId}
            setRejectingId={setRejectingId}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            handleReject={handleReject}
          />
        </div>
      )}

      {/* ── Tab 2: Cash Top-Up & Lookup ── */}
      {activeTab === "topup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Lookup Form & Card */}
          <CustomerLookupCard
            lookupId={lookupId}
            setLookupId={setLookupId}
            handleLookupWallet={handleLookupWallet}
            lookupLoading={lookupLoading}
            lookupError={lookupError}
            topupSuccess={topupSuccess}
            lookupResult={lookupResult}
            customerWallet={customerWallet}
          />

          {/* Right Action Panel */}
          <div className="lg:col-span-2 space-y-6">
            {customerWallet ? (
              <>
                {/* Top-Up Form */}
                <RechargeForm
                  topupAmount={topupAmount}
                  setTopupAmount={setTopupAmount}
                  topupRefNo={topupRefNo}
                  setTopupRefNo={setTopupRefNo}
                  topupRemarks={topupRemarks}
                  setTopupRemarks={setTopupRemarks}
                  topupSubmitting={topupSubmitting}
                  handleTopup={handleTopup}
                />

                {/* Recent Transactions Ledger */}
                <CustomerTxnLedger
                  walletTransactions={walletTransactions}
                  customerWallet={customerWallet}
                  txnPage={txnPage}
                  setTxnPage={setTxnPage}
                  txnPageSize={txnPageSize}
                  txnPagination={txnPagination}
                  loadTransactions={loadTransactions}
                />
              </>
            ) : (
              <WalletAccountCard
                lookupResult={lookupResult}
                openAmount={openAmount}
                setOpenAmount={setOpenAmount}
                openRemarks={openRemarks}
                setOpenRemarks={setOpenRemarks}
                openingSubmitting={openingSubmitting}
                handleCreateWallet={handleCreateWallet}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
