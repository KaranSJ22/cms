import { getMonday } from '../../../../utils/date';

/**
 * Step 1 Context Form: Canteen, Service, Week Start (Monday), and Service Hours
 */
export default function BulkContextForm({
  canteens = [],
  canteenId,
  onCanteenChange,
  services = [],
  serviceId,
  onServiceChange,
  startDate,
  onStartDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  weekDates = [],
  loadingExisting = false,
  dataLoading = false,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <h2 className="font-semibold text-slate-800">
            Canteen, Service &amp; Week
          </h2>
        </div>
        {loadingExisting && (
          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Checking existing week menus…
          </div>
        )}
      </div>

      <div className="p-6">
        {dataLoading ? (
          <div className="flex items-center gap-3 text-slate-500 text-sm py-4">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
            Loading reference data…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Canteen
              </label>
              <select
                id="bulk-canteen"
                value={canteenId}
                onChange={(e) => onCanteenChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
              >
                <option value="">Select Canteen</option>
                {canteens.map((c) => (
                  <option key={c.CANTEENID} value={c.CANTEENID}>
                    {c.CANTEENNAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Service
              </label>
              <select
                id="bulk-service"
                value={serviceId}
                onChange={onServiceChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
              >
                <option value="">Select Service</option>
                {services.map((s) => (
                  <option key={s.SERVICEID} value={s.SERVICEID}>
                    {s.SERVNAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Week of (Mon – Sun)
              </label>
              <input
                id="bulk-startdate"
                type="date"
                value={startDate}
                style={{ colorScheme: 'light' }}
                onChange={(e) => {
                  const monday = getMonday(e.target.value);
                  onStartDateChange(monday);
                }}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 [color-scheme:light]"
              />
              {startDate && weekDates.length === 7 && (
                <span className="block text-[11px] text-blue-600 font-medium mt-1 truncate">
                  {weekDates[0]} (Mon) → {weekDates[6]} (Sun)
                </span>
              )}
            </div>

            <div className="lg:col-span-1 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Start Time
                </label>
                <input
                  id="bulk-starttime"
                  type="time"
                  value={startTime}
                  style={{ colorScheme: 'light' }}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 [color-scheme:light]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  End Time
                </label>
                <input
                  id="bulk-endtime"
                  type="time"
                  value={endTime}
                  style={{ colorScheme: 'light' }}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 [color-scheme:light]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
