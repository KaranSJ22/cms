import { formatINR } from "../../../../utils/formatters";

export default function CustomerTxnLedger({
  walletTransactions,
  customerWallet,
  txnPage,
  setTxnPage,
  txnPageSize,
  txnPagination,
  loadTransactions,
}) {
  return (
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
                const isCredit =
                  tx.TRANSTYPE === "CREDIT" || tx.TRANSTYPE === "REFUND";
                const txnKey = tx.WALLETTRANID || tx.TRANID || idx;
                return (
                  <tr key={txnKey} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {tx.REFNO || `#${txnKey}`}
                    </td>
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
                    <td
                      className={`p-3 font-mono font-bold ${
                        isCredit ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isCredit ? "+" : "-"} {formatINR(tx.AMOUNT)}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {formatINR(tx.BALAFTER)}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {tx.CREATEDAT
                        ? new Date(tx.CREATEDAT).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">
                      {tx.REMARKS || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(txnPagination.totalPages > 1 || txnPagination.totalRows > txnPageSize) && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 rounded-b-2xl">
          <span>
            Showing {((txnPage - 1) * txnPageSize) + 1} to{" "}
            {Math.min(
              txnPage * txnPageSize,
              txnPagination.totalRows || walletTransactions.length
            )}{" "}
            of {txnPagination.totalRows || walletTransactions.length} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const newP = Math.max(1, txnPage - 1);
                setTxnPage(newP);
                if (customerWallet?.CUSTOMERID) {
                  loadTransactions(customerWallet.CUSTOMERID, newP);
                }
              }}
              disabled={txnPage <= 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-700">
              {txnPage} / {txnPagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                const newP = Math.min(txnPagination.totalPages, txnPage + 1);
                setTxnPage(newP);
                if (customerWallet?.CUSTOMERID) {
                  loadTransactions(customerWallet.CUSTOMERID, newP);
                }
              }}
              disabled={txnPage >= txnPagination.totalPages}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
