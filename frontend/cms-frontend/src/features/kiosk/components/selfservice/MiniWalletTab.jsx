import { WalletIcon } from "@heroicons/react/24/outline";
import { formatINR } from "../../../../utils/formatters";

export default function MiniWalletTab({ customer, wallet }) {
  if (!customer?.isWalletEligible || !wallet) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 max-w-xl mx-auto w-full text-center">
      <WalletIcon className="w-16 h-16 text-emerald-400 mx-auto" />
      <div>
        <span className="text-xs font-bold uppercase text-emerald-400 font-mono">
          Prepaid Ledger Balance
        </span>
        <h3 className="text-5xl font-black text-white font-mono mt-1 tracking-tight">
          {formatINR(wallet.balance)}
        </h3>
        {wallet.reserved > 0 && (
          <p className="text-sm text-slate-400 mt-2 font-mono">
            Active Meal Holds:{" "}
            <span className="text-amber-400 font-bold">
              {formatINR(wallet.reserved)}
            </span>
          </p>
        )}
      </div>

      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 text-left space-y-2">
        <p className="font-bold text-slate-200">Wallet Usage Notes:</p>
        <p>
          • Funds are reserved automatically when advance meals are booked.
        </p>
        <p>
          • Cancelling a meal before cutoff releases funds back to your balance
          immediately.
        </p>
        <p>
          • For cash top-up or refund requests, visit the Canteen Manager office.
        </p>
      </div>
    </div>
  );
}
