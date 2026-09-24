import { formatINR } from "../../../../utils/formatters";

export default function CustomerLookupCard({
  lookupId,
  setLookupId,
  handleLookupWallet,
  lookupLoading,
  lookupError,
  topupSuccess,
  lookupResult,
  customerWallet,
}) {
  return (
    <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-base font-black text-slate-900 font-grotesk">
          Customer / Employee Lookup
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Search by Employee ID (e.g. C001, P001), Login ID (cont1), or Customer ID.
        </p>
      </div>

      <form onSubmit={handleLookupWallet} className="space-y-3">
        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Employee ID / Customer ID / Username
          </label>
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="e.g. C001, cont1, or 8"
            className="w-full p-3 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={lookupLoading || !lookupId.trim()}
          className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          {lookupLoading ? "Searching..." : "Lookup Profile & Wallet"}
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
                {lookupResult.customer.CTYPENAME ||
                  (lookupResult.customer.CTYPECODE === "CNT"
                    ? "Contract Employee"
                    : lookupResult.customer.CTYPECODE === "VIS"
                    ? "Visitor"
                    : "Permanent Staff")}
              </span>
              <p className="text-lg font-bold">
                {lookupResult.customer.DISPNAME ||
                  `Customer #${lookupResult.customer.CUSTOMERID}`}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                {lookupResult.customer.EMPLOYEE_CODE && (
                  <span className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded font-bold">
                    ID: {lookupResult.customer.EMPLOYEE_CODE}
                  </span>
                )}
                <span>Cust #{lookupResult.customer.CUSTOMERID}</span>
                {lookupResult.customer.LOGINID && (
                  <span>({lookupResult.customer.LOGINID})</span>
                )}
              </div>
              {lookupResult.customer.VENDORNAME && (
                <p className="text-[0.7rem] text-slate-400 mt-1">
                  Vendor: {lookupResult.customer.VENDORNAME}
                </p>
              )}
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
              {customerWallet
                ? "ACTIVE WALLET"
                : lookupResult.isPermanent
                ? "DIRECT BILLING"
                : "NO WALLET"}
            </span>
          </div>

          {customerWallet ? (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Current Balance</span>
              <p className="text-3xl font-black font-mono text-emerald-400">
                {formatINR(
                  customerWallet.AVAILABLEBALANCE ?? customerWallet.BALANCE
                )}
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
  );
}
