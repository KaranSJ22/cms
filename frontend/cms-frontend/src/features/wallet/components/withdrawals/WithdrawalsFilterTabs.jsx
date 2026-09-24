export default function WithdrawalsFilterTabs({
  activeTab,
  setActiveTab,
  withdrawalsCount = 0,
}) {
  return (
    <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 gap-1">
      <button
        type="button"
        onClick={() => setActiveTab("topup")}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === "topup"
            ? "bg-orange-500 text-slate-950 shadow-md"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Wallet Management & Top-Up
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("withdrawals")}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === "withdrawals"
            ? "bg-orange-500 text-slate-950 shadow-md"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Pending Withdrawals {withdrawalsCount > 0 && `(${withdrawalsCount})`}
      </button>
    </div>
  );
}
