import { formatINR } from "../../../../utils/formatters";

export default function WalletAccountCard({
  lookupResult,
  openAmount,
  setOpenAmount,
  openRemarks,
  setOpenRemarks,
  openingSubmitting,
  handleCreateWallet,
}) {
  if (lookupResult && !lookupResult.hasWallet && lookupResult.isEligible) {
    return (
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
                  className={`px-2 py-0.5 text-[0.65rem] font-bold rounded cursor-pointer ${
                    openAmount === "0" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  ₹0 (Zero Balance)
                </button>
                <button
                  type="button"
                  onClick={() => setOpenAmount("100")}
                  className={`px-2 py-0.5 text-[0.65rem] font-bold rounded cursor-pointer ${
                    openAmount === "100" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  ₹100
                </button>
                <button
                  type="button"
                  onClick={() => setOpenAmount("500")}
                  className={`px-2 py-0.5 text-[0.65rem] font-bold rounded cursor-pointer ${
                    openAmount === "500" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  ₹500
                </button>
              </div>
              <p className="text-[0.65rem] text-slate-400 mt-1">
                Leave 0 for empty wallet, or enter minimum ₹100 for cash opening.
              </p>
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
            disabled={
              openingSubmitting ||
              (Number(openAmount) > 0 && Number(openAmount) < 100)
            }
            className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {openingSubmitting ? (
              "Creating Wallet..."
            ) : (
              <>
                <span>
                  Create Wallet ({Number(openAmount) > 0 ? formatINR(openAmount) : "₹0 Balance"})
                </span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  if (lookupResult?.isPermanent) {
    return (
      <div className="bg-white rounded-3xl border border-blue-200 shadow-sm p-8 text-center text-slate-600 space-y-3">
        <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
          ℹ️
        </div>
        <h3 className="text-base font-black text-slate-900 font-grotesk">
          Permanent Employee Account
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Customer <strong>{lookupResult.customer.DISPNAME}</strong> (ID #{lookupResult.customer.CUSTOMERID}) is a Permanent Employee. Permanent staff do not maintain prepaid wallets; their meal reservations are settled directly through institutional billing.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 space-y-2">
      <p className="text-base font-bold text-slate-700">No Customer Selected</p>
      <p className="text-xs max-w-sm mx-auto">
        Look up a Contract Employee or Visitor Customer ID on the left to activate their wallet, add cash credit, or view transaction records.
      </p>
    </div>
  );
}
