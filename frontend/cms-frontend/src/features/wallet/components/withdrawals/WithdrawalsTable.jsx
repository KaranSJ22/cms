import { formatINR } from "../../../../utils/formatters";

export default function WithdrawalsTable({
  withdrawals,
  withdrawalsLoading,
  loadWithdrawals,
  actionLoading,
  handleApprove,
  setRejectingId,
}) {
  return (
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
          type="button"
          onClick={loadWithdrawals}
          disabled={withdrawalsLoading}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {withdrawalsLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Loading withdrawal requests...
        </div>
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
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      #{wid}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {w.CUSTOMERNAME || w.DISPNAME || `Customer #${w.CUSTOMERID}`}
                    </td>
                    <td className="p-3.5 font-mono font-black text-rose-600">
                      {formatINR(w.AMOUNT || w.WITHDRAWAMT)}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {w.CREATEDAT
                        ? new Date(w.CREATEDAT).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {w.REMARKS || "—"}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(wid)}
                        disabled={isActing}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isActing ? "Processing..." : "Approve & Pay"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(wid)}
                        disabled={isActing}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 transition-all disabled:opacity-50 cursor-pointer"
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
  );
}
