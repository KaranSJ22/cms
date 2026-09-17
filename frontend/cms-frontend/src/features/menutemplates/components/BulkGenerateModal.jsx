import { useState, useEffect } from 'react';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';
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
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Bulk Generate Menus</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-lg">✕</button>
        </div>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Generate day menus automatically based on active menu templates for the selected date range. Existing day menus in Draft status will be overwritten.
        </p>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Service
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-shadow"
            >
              {services.map((s) => (
                <option key={s.SERVICEID} value={s.SERVICEID}>
                  {s.SERVNAME} ({s.STARTTIME?.slice(0, 5)} - {s.ENDTIME?.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              style={{ colorScheme: 'light' }}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none [color-scheme:light] transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              style={{ colorScheme: 'light' }}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none [color-scheme:light] transition-shadow"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <GhostBtn onClick={onClose} disabled={loading}>Cancel</GhostBtn>
          <PrimaryBtn onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Menus'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
