import { LockClosedIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";

export default function ShiftLoginCard({
  shiftLoginId,
  setShiftLoginId,
  shiftPassword,
  setShiftPassword,
  shiftLoginLoading,
  shiftLoginError,
  selectedCanteenId,
  setSelectedCanteenId,
  canteens,
  handleShiftLogin,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-950 font-inter">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
          <LockClosedIcon className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white font-grotesk tracking-tight">
            Staff Shift Sign-In
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select your Canteen Facility and sign in with staff credentials to
            unlock this terminal.
          </p>
        </div>

        {shiftLoginError && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-600/80 text-rose-200 rounded-xl text-xs font-bold text-left animate-in fade-in">
            <p>
              {typeof shiftLoginError === "object"
                ? shiftLoginError.message
                : shiftLoginError}
            </p>
            {typeof shiftLoginError === "object" &&
              shiftLoginError.correlationId && (
                <p className="text-[0.68rem] font-mono text-rose-400 mt-1 font-normal tracking-wide">
                  Ref ID: {shiftLoginError.correlationId}
                </p>
              )}
          </div>
        )}

        <form onSubmit={handleShiftLogin} className="space-y-4 text-left">
          {/* Canteen Facility Dropdown */}
          <div>
            <label className="block text-[0.7rem] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
              <BuildingStorefrontIcon className="w-4 h-4 text-orange-400" />
              <span>Canteen Facility</span>
            </label>
            <select
              value={selectedCanteenId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedCanteenId(id);
                localStorage.setItem("cms_kiosk_canteen_id", String(id));
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {canteens.map((c) => (
                <option key={c.CANTEENID} value={c.CANTEENID}>
                  {c.CANTEENNAME} ({c.CANTEENCODE}){" "}
                  {c.LOCATION ? `• ${c.LOCATION}` : ""}
                </option>
              ))}
              {canteens.length === 0 && (
                <option value={selectedCanteenId}>
                  Canteen Facility #{selectedCanteenId}
                </option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[0.7rem] uppercase font-bold text-slate-400 mb-1">
              Staff Login ID
            </label>
            <input
              type="text"
              value={shiftLoginId}
              onChange={(e) => setShiftLoginId(e.target.value)}
              placeholder="e.g. staff1"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[0.7rem] uppercase font-bold text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={shiftPassword}
              onChange={(e) => setShiftPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={shiftLoginLoading}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-400 text-slate-950 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {shiftLoginLoading
              ? "Authenticating Shift..."
              : "Start Shift & Unlock Scanner"}
          </button>
        </form>
      </div>
    </div>
  );
}
