import { useState, useEffect } from 'react';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';
import { FormField } from '../../../components/ui/FormComponents';
import { menuTemplateApi } from '../api/menuTemplateApi';
import { getServices } from '../../services/api/servicesApi';

export function BulkGenerateModal({ isOpen, onClose, canteenId, onComplete }) {
  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      getServices().then((data) => {
        const sList = Array.isArray(data) ? data : [];
        setServices(sList);
        if (sList.length > 0) setServiceId(sList[0].SERVICEID);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!serviceId || !startDate || !endDate) {
      setError("Please select service, start date, and end date.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await menuTemplateApi.bulkGenerateMenu({
        PCANTEENID: Number(canteenId),
        PSERVICEID: Number(serviceId),
        PSTARTDATE: startDate,
        PENDDATE: endDate
      });
      onComplete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.MESSAGE || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all border border-white/20">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Bulk Generate Menus</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          This will generate day menus based on the active menu templates for the selected date range. Existing day menus in Draft status will be overwritten.
        </p>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Service
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              {services.map((s) => (
                <option key={s.SERVICEID} value={s.SERVICEID}>
                  {s.SERVNAME} ({s.STARTTIME?.slice(0, 5)} - {s.ENDTIME?.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>
          <FormField
            id="start-date"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={setStartDate}
          />
          <FormField
            id="end-date"
            label="End Date"
            type="date"
            value={endDate}
            onChange={setEndDate}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <GhostBtn onClick={onClose} disabled={loading}>Cancel</GhostBtn>
          <PrimaryBtn onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Menus'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
