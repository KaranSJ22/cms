import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarDaysIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { holidayApi } from '../api/holidayApi';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';
import { formatDate, formatFullDate } from '../../../utils/date';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function HolidaysPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    PHOLIDAYDATE: '',
    PHOLIDAYNAME: '',
    PHOLIDAYTYPE: 'NATIONAL',
    PISRECURRING: 0,
  });

  const fetchHolidays = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await holidayApi.getHolidays({ year: selectedYear, includeInactive: 'false' });
      const data = res.data?.DATA || res.data || [];
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load holiday calendar:', err);
      setError(err.response?.data?.MESSAGE || 'Failed to load holiday calendar.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Statistics & Upcoming Holiday Countdown
  const stats = useMemo(() => {
    const total = holidays.length;
    let nationalCount = 0;
    let restrictedCount = 0;
    let upcoming = null;
    let minDiffMs = Infinity;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    holidays.forEach((h) => {
      const type = (h.HOLIDAYTYPE || 'NATIONAL').toUpperCase();
      if (type === 'RESTRICTED') restrictedCount++;
      else nationalCount++;

      // Compute nearest upcoming
      if (h.HOLIDAYDATE) {
        const hDate = new Date(h.HOLIDAYDATE + 'T00:00:00');
        const diffMs = hDate.getTime() - todayDate.getTime();
        if (diffMs >= 0 && diffMs < minDiffMs) {
          minDiffMs = diffMs;
          const daysAway = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          upcoming = {
            ...h,
            daysAway,
          };
        }
      }
    });

    return {
      total,
      nationalCount,
      restrictedCount,
      upcoming,
    };
  }, [holidays]);

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (h.HOLIDAYNAME || '').toLowerCase().includes(q);
        const matchDate = (h.HOLIDAYDATE || '').toLowerCase().includes(q);
        const matchType = (h.HOLIDAYTYPE || '').toLowerCase().includes(q);
        if (!matchName && !matchDate && !matchType) return false;
      }

      // Month Filter
      if (selectedMonth !== 'ALL' && h.HOLIDAYDATE) {
        const monthNum = parseInt(h.HOLIDAYDATE.split('-')[1], 10);
        if (monthNum !== parseInt(selectedMonth, 10)) return false;
      }

      // Classification Filter
      if (selectedType !== 'ALL') {
        const hType = (h.HOLIDAYTYPE || 'NATIONAL').toUpperCase();
        if (hType !== selectedType) return false;
      }

      return true;
    });
  }, [holidays, searchQuery, selectedMonth, selectedType]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormError(null);
    setFormData({
      PHOLIDAYDATE: `${selectedYear}-01-01`,
      PHOLIDAYNAME: '',
      PHOLIDAYTYPE: 'NATIONAL',
      PISRECURRING: 0,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormError(null);
    setFormData({
      PHOLIDAYDATE: holiday.HOLIDAYDATE ? holiday.HOLIDAYDATE.split('T')[0] : '',
      PHOLIDAYNAME: holiday.HOLIDAYNAME || '',
      PHOLIDAYTYPE: holiday.HOLIDAYTYPE || 'NATIONAL',
      PISRECURRING: holiday.ISRECURRING ? 1 : 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.PHOLIDAYDATE) {
      setFormError('Holiday date is required (YYYY-MM-DD).');
      return;
    }
    if (!formData.PHOLIDAYNAME.trim()) {
      setFormError('Holiday name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        PHOLIDAYDATE: formData.PHOLIDAYDATE,
        PHOLIDAYNAME: formData.PHOLIDAYNAME.trim(),
        PHOLIDAYTYPE: formData.PHOLIDAYTYPE,
        PISRECURRING: formData.PISRECURRING ? 1 : 0,
      };

      if (editingHoliday) {
        const id = editingHoliday.HOLIDAYID || editingHoliday.PHOLIDAYID;
        await holidayApi.updateHoliday(id, {
          ...payload,
          PSTATUSCODE: 'ACT',
        });
      } else {
        await holidayApi.createHoliday(payload);
      }

      setShowModal(false);
      await fetchHolidays(true);
    } catch (err) {
      console.error('Failed to save holiday:', err);
      setFormError(err.response?.data?.MESSAGE || 'Failed to save holiday.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (holiday) => {
    const id = holiday.HOLIDAYID || holiday.PHOLIDAYID;
    if (!window.confirm(`Are you sure you want to remove "${holiday.HOLIDAYNAME}" from the holiday calendar?`)) {
      return;
    }

    try {
      await holidayApi.deactivateHoliday(id);
      await fetchHolidays(true);
    } catch (err) {
      alert(err.response?.data?.MESSAGE || 'Failed to remove holiday.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-inter">
      {/* ── Page Header Banner (Stripe Clean Canvas) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 lg:px-8 py-5 bg-white border-b border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarDaysIcon className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold font-grotesk text-slate-900 tracking-tight">
              Canteen Holiday Calendar
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Gazetted national holidays, restricted holidays, and planned canteen closure schedules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Year Picker */}
          <div className="flex items-center bg-white border border-slate-300 rounded-md px-2.5 py-1.5 shadow-xs">
            <span className="text-[0.70rem] font-bold uppercase tracking-wider text-slate-500 mr-2 font-grotesk">
              Year:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold font-grotesk text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>

          <button
            onClick={() => fetchHolidays(true)}
            disabled={refreshing || loading}
            title="Refresh Holiday Calendar"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold font-grotesk bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 transition-colors shadow-xs disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <PrimaryBtn onClick={handleOpenAdd} className="!w-auto">
            <PlusIcon className="w-4 h-4" />
            <span>Add Holiday</span>
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Annual Metrics & Countdown Cards ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Annual Calendar Holidays */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">
                Annual Holidays ({selectedYear})
              </span>
              <CalendarDaysIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900">
              {stats.total} <span className="text-xs font-normal text-slate-500 font-inter">Days</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Scheduled non-working days for calendar year {selectedYear}
            </div>
          </div>

          {/* Card 2: Upcoming Holiday Countdown */}
          <div className="bg-white rounded-xl border border-orange-200 p-4 shadow-xs bg-orange-50/20">
            <div className="flex items-center justify-between text-orange-800 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">
                Upcoming Holiday
              </span>
              <ClockIcon className="w-5 h-5 text-orange-500" />
            </div>
            {stats.upcoming ? (
              <>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl sm:text-2xl font-bold font-grotesk text-slate-900 truncate">
                    {stats.upcoming.HOLIDAYNAME}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.68rem] font-bold font-grotesk bg-orange-100 text-orange-800 flex-shrink-0">
                    {stats.upcoming.daysAway === 0
                      ? 'Today'
                      : stats.upcoming.daysAway === 1
                      ? 'Tomorrow'
                      : `in ${stats.upcoming.daysAway} days`}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatFullDate(stats.upcoming.HOLIDAYDATE?.split('T')[0])}
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold font-grotesk text-slate-700">None Remaining</div>
                <div className="text-xs text-slate-400 mt-1">No upcoming holidays left for {selectedYear}</div>
              </>
            )}
          </div>

          {/* Card 3: Classification Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">
                Classification Breakdown
              </span>
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900">
              {stats.nationalCount} <span className="text-sm font-normal text-slate-500 font-inter">Gazetted</span>
              <span className="text-slate-300 font-light mx-2">/</span>
              {stats.restrictedCount} <span className="text-sm font-normal text-slate-500 font-inter">Restricted</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Canteen meal prep & serving suspended on gazetted days
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Query */}
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by holiday name (e.g. Republic Day, Diwali)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Month Filter */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-1.5 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 transition-colors"
            >
              <option value="ALL">All Months</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={String(idx + 1).padStart(2, '0')}>
                  {name}
                </option>
              ))}
            </select>

            {/* Classification Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="py-1.5 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 transition-colors"
            >
              <option value="ALL">All Classifications</option>
              <option value="NATIONAL">Gazetted / National</option>
              <option value="RESTRICTED">Restricted / Optional</option>
              <option value="CENTRAL">Central Govt</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Holiday Calendar Table ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-3" />
              <p className="text-sm font-grotesk font-semibold text-slate-700">Loading holiday calendar...</p>
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CalendarDaysIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-grotesk font-semibold text-slate-700">
                No holidays found for {selectedYear}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || selectedMonth !== 'ALL' || selectedType !== 'ALL'
                  ? 'Try clearing the search query or adjusting your filters.'
                  : 'Add the first official holiday for this calendar year.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-[0.72rem] font-bold uppercase tracking-wider text-slate-500 font-grotesk">
                  <tr>
                    <th className="py-3 px-4">Date & Day</th>
                    <th className="py-3 px-4">Holiday Name</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Recurrence</th>
                    <th className="py-3 px-4">Canteen Service Impact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredHolidays.map((holiday) => {
                    const rawDate = holiday.HOLIDAYDATE ? holiday.HOLIDAYDATE.split('T')[0] : '';
                    const dayOfWeek = rawDate
                      ? new Date(rawDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })
                      : '';
                    const isRestricted = (holiday.HOLIDAYTYPE || '').toUpperCase() === 'RESTRICTED';

                    return (
                      <tr key={holiday.HOLIDAYID || holiday.PHOLIDAYID} className="hover:bg-slate-50/70 transition-colors">
                        {/* Date & Day */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold font-grotesk text-slate-900 text-sm">
                            {formatDate(rawDate)}
                          </div>
                          <div className="text-[0.70rem] text-slate-400 font-medium">
                            {dayOfWeek}
                          </div>
                        </td>

                        {/* Holiday Name */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                            <span className="font-grotesk text-sm">{holiday.HOLIDAYNAME}</span>
                          </div>
                        </td>

                        {/* Classification */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isRestricted ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.70rem] font-bold font-grotesk bg-purple-50 text-purple-700 border border-purple-200">
                              Restricted / Optional
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.70rem] font-bold font-grotesk bg-indigo-50 text-indigo-700 border border-indigo-200">
                              National / Gazetted
                            </span>
                          )}
                        </td>

                        {/* Recurrence */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {holiday.ISRECURRING ? (
                            <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Annual Recurring
                            </span>
                          ) : (
                            <span className="text-[0.72rem] text-slate-400 italic">One-Time</span>
                          )}
                        </td>

                        {/* Canteen Service Impact */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[0.70rem] font-bold font-grotesk bg-red-50 text-red-700 border border-red-200">
                            <XCircleIcon className="w-3.5 h-3.5 text-red-600" />
                            Canteen Closed
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(holiday)}
                              title="Edit Holiday"
                              className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeactivate(holiday)}
                              title="Delete Holiday"
                              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Register / Edit Holiday ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold font-grotesk">
                  {editingHoliday ? `Edit Holiday: ${editingHoliday.HOLIDAYNAME}` : 'Register Annual Holiday'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs sm:text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Holiday Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.PHOLIDAYDATE}
                  onChange={(e) => setFormData({ ...formData, PHOLIDAYDATE: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.PHOLIDAYNAME}
                  onChange={(e) => setFormData({ ...formData, PHOLIDAYNAME: e.target.value })}
                  placeholder="e.g. Republic Day, Independence Day, Diwali"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Holiday Classification *
                </label>
                <select
                  value={formData.PHOLIDAYTYPE}
                  onChange={(e) => setFormData({ ...formData, PHOLIDAYTYPE: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-colors"
                >
                  <option value="NATIONAL">NATIONAL (Gazetted Public Holiday)</option>
                  <option value="RESTRICTED">RESTRICTED (Restricted / Optional Holiday)</option>
                  <option value="CENTRAL">CENTRAL (Central Govt Holiday)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-recurring-check"
                  checked={Boolean(formData.PISRECURRING)}
                  onChange={(e) => setFormData({ ...formData, PISRECURRING: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="is-recurring-check" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Repeats annually on this date (Annual Recurring)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <GhostBtn onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </GhostBtn>
                <PrimaryBtn type="submit" loading={submitting} className="!w-auto">
                  {editingHoliday ? 'Save Changes' : 'Register Holiday'}
                </PrimaryBtn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
