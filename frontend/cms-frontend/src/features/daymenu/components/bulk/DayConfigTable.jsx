import DayConfigRow from './DayConfigRow';
import { DAY_FULL, DAY_SHORT } from '../../hooks/useBulkMenuPlanner';

/**
 * 2-Column Day Configuration Studio:
 * Left: Searchable Dish Master Catalog
 * Right: Configured Dishes Tray with controls for the active day
 */
export default function DayConfigTable({
  activeDayIndex,
  weekDates = [],
  holidayMap = {},
  holidayOverrides = {},
  setHolidayOverrides,
  publishedDays = {},
  daySummary = [],
  itemSearch,
  setItemSearch,
  filteredCatalog = [],
  selectedItemsList = [],
  activeDayMap = {},
  selectedIds = [],
  menuItems = [],
  onAddItem,
  onRemoveItem,
  onUpdateFlag,
  onUpdateQty,
  onApplyToAllDays,
  onCopyFromDayClick,
  onClearDay,
}) {
  const isPublished = Boolean(publishedDays[activeDayIndex]);
  const isHoliday = Boolean(holidayMap[weekDates[activeDayIndex]]);
  const isHolidayOverridden = Boolean(holidayOverrides[activeDayIndex]);

  return (
    <>
      {/* Day action bar */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50 flex-wrap justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-slate-700">
            {weekDates[activeDayIndex]
              ? `${DAY_FULL[activeDayIndex]} (${weekDates[activeDayIndex]})`
              : `${DAY_FULL[activeDayIndex]} (set date first)`}
          </span>
          {isHoliday && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-md border border-rose-200">
                🏖️ Holiday: {holidayMap[weekDates[activeDayIndex]]}
              </span>
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors bg-white shadow-2xs border-slate-300 hover:border-orange-400">
                <input
                  type="checkbox"
                  checked={isHolidayOverridden}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setHolidayOverrides((prev) => ({
                      ...prev,
                      [activeDayIndex]: val,
                    }));
                  }}
                  className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                />
                <span
                  className={
                    isHolidayOverridden
                      ? 'text-orange-700 font-bold'
                      : 'text-slate-600'
                  }
                >
                  Open Canteen on this Holiday
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {daySummary[activeDayIndex] > 0 && !isPublished && (
            <>
              <button
                type="button"
                onClick={onApplyToAllDays}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                title="Copy this day's items to remaining non-published days"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Apply to other days
              </button>
              <button
                type="button"
                onClick={onClearDay}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear day
              </button>
            </>
          )}
          {!isPublished && (
            <button
              type="button"
              onClick={onCopyFromDayClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Copy from…
            </button>
          )}
          {isPublished && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Menu Published (Timings editable)
            </span>
          )}
        </div>
      </div>

      {/* Closed Holiday Warning Notice */}
      {isHoliday && !isHolidayOverridden && !isPublished && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 text-xs text-amber-800">
            <span className="text-base">🏖️</span>
            <span>
              <strong>{DAY_FULL[activeDayIndex]}</strong> is a public holiday (
              <strong>{holidayMap[weekDates[activeDayIndex]]}</strong>) and will
              be skipped by default.
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              setHolidayOverrides((prev) => ({
                ...prev,
                [activeDayIndex]: true,
              }))
            }
            className="px-3 py-1 bg-amber-600 text-white font-semibold text-xs rounded-lg hover:bg-amber-700 transition cursor-pointer"
          >
            Enable Catering for this Day
          </button>
        </div>
      )}

      {/* Published / Locked Notice */}
      {isPublished && (
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </span>
          <p className="text-xs text-emerald-800 leading-snug">
            <strong className="font-semibold">Day menu is published and locked:</strong>{' '}
            Menu items cannot be edited or removed to preserve customer orders.
            Serving hours (start/end) can still be adjusted above.
          </p>
        </div>
      )}

      {/* Two-column layout: catalog + configured */}
      <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
        {/* Catalog */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="bulk-item-search"
                type="text"
                placeholder={
                  isPublished
                    ? 'Catalog locked for published day'
                    : 'Search catalog…'
                }
                value={itemSearch}
                disabled={isPublished}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-72 divide-y divide-slate-50">
            {isPublished ? (
              <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
                <svg
                  className="w-8 h-8 text-slate-300 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="font-medium text-slate-600">Menu is published</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Items cannot be added to this day.
                </p>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                {itemSearch
                  ? 'No matches.'
                  : selectedIds.length === menuItems.length
                  ? 'All items selected.'
                  : 'No active items.'}
              </div>
            ) : (
              filteredCatalog.map((item) => (
                <button
                  key={item.MENUITEMID}
                  type="button"
                  onClick={() => onAddItem(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors group cursor-pointer"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-slate-800 truncate">
                      {item.ITEMNAME}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.MENUCODE}
                    </span>
                  </span>
                  <span className="shrink-0 opacity-0 group-hover:opacity-100 text-xs font-semibold text-blue-600 flex items-center gap-1 transition-opacity">
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Configured items for active day */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {DAY_SHORT[activeDayIndex]} — {selectedIds.length} item
              {selectedIds.length !== 1 ? 's' : ''} configured
            </span>
            {isPublished && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Locked
              </span>
            )}
          </div>
          <div className="overflow-y-auto max-h-72 p-3 space-y-2">
            {selectedItemsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-slate-400 text-sm text-center py-8">
                <svg
                  className="w-10 h-10 text-slate-300 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p>
                  Click items from the catalog to add them to{' '}
                  {DAY_SHORT[activeDayIndex]}.
                </p>
              </div>
            ) : (
              selectedItemsList.map((item) => (
                <DayConfigRow
                  key={item.MENUITEMID}
                  item={item}
                  config={activeDayMap[item.MENUITEMID]}
                  onUpdateFlag={onUpdateFlag}
                  onUpdateQty={onUpdateQty}
                  onRemove={onRemoveItem}
                  isReadOnly={isPublished}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
