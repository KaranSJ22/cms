export default function WithdrawalReviewModal({
  rejectingId,
  setRejectingId,
  rejectReason,
  setRejectReason,
  handleReject,
}) {
  if (!rejectingId) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
        <h3 className="text-base font-bold text-slate-900">
          Reject Withdrawal Request #{rejectingId}
        </h3>
        <p className="text-xs text-slate-500">
          Please provide a reason for rejecting this cash withdrawal.
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection (e.g. Unverified identity, dispute in balance)"
          rows={3}
          className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setRejectingId(null);
              setRejectReason("");
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleReject(rejectingId)}
            disabled={!rejectReason.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
