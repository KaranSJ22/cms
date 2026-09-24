/**
 * Header and feedback alert banners for Bulk Menu Creator
 */
export default function PublishSummaryBanner({
  error,
  successToast,
  onDismissToast,
  results,
  onReset,
}) {
  return (
    <>
      {/* ── Header ── */}
      <div className="bg-[#0F172A] rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Bulk Menu Creator (7-Day Horizon)
              </h1>
            </div>
            <p className="text-blue-100/60 text-sm max-w-xl">
              Configure items for Monday through Sunday (7 days). Any holidays in
              between are automatically skipped unless overridden. Set serving
              hours and menu items for the entire week.
            </p>
          </div>
          {results && (
            <button
              type="button"
              onClick={onReset}
              className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/20 transition-colors cursor-pointer"
            >
              + New Batch
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <svg
            className="mt-0.5 shrink-0 w-5 h-5 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-semibold text-rose-800 text-sm">
              Bulk creation failed
            </p>
            <p className="text-rose-700 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Success Toast ── */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold shrink-0">
              ✓
            </span>
            <div>
              <p className="font-semibold text-emerald-900 text-sm">
                Operation Successful
              </p>
              <p className="text-emerald-700 text-sm mt-0.5">{successToast}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissToast}
            className="text-emerald-600 hover:text-emerald-800 p-1.5 rounded-lg hover:bg-emerald-100/60 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
