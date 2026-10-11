import { formatINR } from "../utils/formatters";

export default function MiniWalletTab({ wallet }) {
  if (!wallet) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-md mx-auto w-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>💳</span> Canteen Wallet Overview
        </h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
          Active Account
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-xs font-medium text-slate-400">Available Balance</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">
            {formatINR(wallet.balance)}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed text-center mt-2">
          Your wallet is charged automatically upon pre-booking confirmation. To recharge, visit the canteen cashier counter.
        </p>
      </div>
    </div>
  );
}
