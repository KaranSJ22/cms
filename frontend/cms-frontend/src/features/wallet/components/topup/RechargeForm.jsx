import { formatINR } from "../../../../utils/formatters";

export default function RechargeForm({
  topupAmount,
  setTopupAmount,
  topupRefNo,
  setTopupRefNo,
  topupRemarks,
  setTopupRemarks,
  topupSubmitting,
  handleTopup,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-black text-slate-900 font-grotesk">
          Process Cash Top-Up
        </h2>
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
                  className="px-2.5 py-1 text-[0.65rem] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-mono cursor-pointer"
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
          disabled={
            topupSubmitting || !topupAmount || Number(topupAmount) < 100
          }
          className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
        >
          {topupSubmitting
            ? "Crediting..."
            : `Credit ${topupAmount ? formatINR(topupAmount) : "Cash"} to Wallet`}
        </button>
      </form>
    </div>
  );
}
