/**
 * Configuration row for an individual dish on a specific day
 */
export default function DayConfigRow({
  item,
  config,
  onUpdateFlag,
  onUpdateQty,
  onRemove,
  isReadOnly = false,
}) {
  const flags = [
    { key: 'ISBASE', label: 'Base' },
    { key: 'ISSPECIAL', label: 'Special' },
    { key: 'ISPREBOOK', label: 'Pre-book' },
    { key: 'ISKIOSK', label: 'Kiosk' },
  ];

  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-xl border transition-colors group ${
        isReadOnly
          ? 'bg-slate-100/70 border-slate-200'
          : 'bg-slate-50 border-slate-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-800 text-sm truncate">
          {item.ITEMNAME}
        </span>
        {!isReadOnly && (
          <button
            type="button"
            onClick={() => onRemove(item.MENUITEMID)}
            className="shrink-0 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Remove item"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {flags.map(({ key, label }) => {
          const active = config[key] === 1;
          return (
            <button
              key={key}
              type="button"
              disabled={isReadOnly}
              onClick={() => onUpdateFlag(item.MENUITEMID, key, active ? 0 : 1)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                isReadOnly
                  ? active
                    ? 'bg-slate-300 text-slate-800 border-slate-300 cursor-default'
                    : 'bg-transparent text-slate-400 border-slate-200 cursor-default'
                  : active
                  ? 'bg-blue-600 text-white border-blue-600 cursor-pointer'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 cursor-pointer'
              }`}
            >
              {label}
            </button>
          );
        })}

        <div className="flex items-center gap-1.5 ml-auto">
          <label className="text-xs text-slate-400">Max</label>
          <input
            type="number"
            min={1}
            value={config.MAXQTY}
            disabled={isReadOnly}
            onChange={(e) =>
              onUpdateQty(
                item.MENUITEMID,
                'MAXQTY',
                parseInt(e.target.value) || 1
              )
            }
            className={`w-14 px-2 py-0.5 text-xs border rounded-lg outline-none ${
              isReadOnly
                ? 'bg-slate-200/60 border-slate-300 text-slate-600 cursor-not-allowed'
                : 'border-slate-200 focus:border-blue-500'
            }`}
          />
          <label className="text-xs text-slate-400">Avail</label>
          <input
            type="number"
            min={0}
            placeholder="∞"
            value={config.AVAILQTY ?? ''}
            disabled={isReadOnly}
            onChange={(e) =>
              onUpdateQty(
                item.MENUITEMID,
                'AVAILQTY',
                e.target.value === '' ? null : parseInt(e.target.value)
              )
            }
            className={`w-14 px-2 py-0.5 text-xs border rounded-lg outline-none ${
              isReadOnly
                ? 'bg-slate-200/60 border-slate-300 text-slate-600 cursor-not-allowed'
                : 'border-slate-200 focus:border-blue-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
