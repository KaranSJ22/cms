import { useState, useEffect, useCallback } from 'react';
import { holidayApi } from '../api/holidayApi';
import { PrimaryBtn } from '../../../components/ui/Buttons';
import { FormField } from '../../../components/ui/FormComponents';
import { formatDate } from '../../../utils/date';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formData, setFormData] = useState({
    HOLIDAYDATE: '',
    HOLIDAYNAME: '',
    ISNONWORKING: '1'
  });

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await holidayApi.getHolidays({ year: new Date().getFullYear() });
      setHolidays(res.data?.DATA || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await holidayApi.getHolidays({ year: new Date().getFullYear() });
        if (!ignore) setHolidays(res.data?.DATA || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => { ignore = true; };
  }, []);

  const handleSave = async () => {
    try {
      await holidayApi.createHoliday({
        ...formData,
        ISNONWORKING: parseInt(formData.ISNONWORKING, 10)
      });
      setIsAddMode(false);
      setFormData({ HOLIDAYDATE: '', HOLIDAYNAME: '', ISNONWORKING: '1' });
      fetchHolidays();
    } catch (err) {
      console.error(err);
      alert('Error creating holiday');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Holiday Calendar</h1>
          <p className="text-neutral-500">Manage non-working days for the year</p>
        </div>
        <PrimaryBtn onClick={() => setIsAddMode(!isAddMode)}>
          {isAddMode ? 'Cancel' : 'Add Holiday'}
        </PrimaryBtn>
      </div>

      {isAddMode && (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2">
          <div className="flex-1 min-w-[200px]">
            <FormField 
              id="holiday-date"
              label="Date" 
              type="date" 
              value={formData.HOLIDAYDATE}
              onChange={(val) => setFormData(prev => ({...prev, HOLIDAYDATE: typeof val === 'object' ? val.target?.value : val}))}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <FormField 
              id="holiday-name"
              label="Holiday Name" 
              value={formData.HOLIDAYNAME}
              onChange={(val) => setFormData(prev => ({...prev, HOLIDAYNAME: typeof val === 'object' ? val.target?.value : val}))}
              placeholder="e.g. Independence Day"
            />
          </div>
          <PrimaryBtn onClick={handleSave}>Save</PrimaryBtn>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="grid grid-cols-4 gap-4 p-4 font-semibold text-sm text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="col-span-1">Date</div>
          <div className="col-span-2">Holiday Name</div>
          <div className="col-span-1 text-right">Status</div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading...</div>
        ) : holidays.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No holidays found for this year.</div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
            {holidays.map(holiday => (
              <div key={holiday.PHOLIDAYID || holiday.HOLIDAYID} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className="col-span-1 font-medium dark:text-neutral-200">
                  {formatDate(holiday.HOLIDAYDATE, 'DD MMM YYYY')}
                </div>
                <div className="col-span-2 text-neutral-700 dark:text-neutral-300">
                  {holiday.HOLIDAYNAME}
                </div>
                <div className="col-span-1 text-right flex justify-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    holiday.ISNONWORKING 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {holiday.ISNONWORKING ? 'Non-Working' : 'Working'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
