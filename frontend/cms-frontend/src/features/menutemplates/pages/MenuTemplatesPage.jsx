import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { menuTemplateApi } from '../api/menuTemplateApi';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';
import { BulkGenerateModal } from '../components/BulkGenerateModal';
import { TemplateCreateModal } from '../components/TemplateCreateModal';

const DAY_NAMES = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export default function MenuTemplatesPage() {
  const { user, activeCanteenId } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateItems, setTemplateItems] = useState([]);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const effectiveCanteenId = activeCanteenId || user?.CANTEENROLES?.[0]?.CANTEENID;
      if (!effectiveCanteenId) {
        setLoading(false);
        return;
      }
      const res = await menuTemplateApi.getTemplates({ canteenId: effectiveCanteenId });
      setTemplates(res.data?.DATA || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCanteenId, user?.CANTEENROLES]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const fetchTemplateItems = async (templateId) => {
    try {
      const res = await menuTemplateApi.getTemplateDetails(templateId);
      const items = res.data?.DATA?.ITEMS || res.data?.ITEMS || res.data?.DATA || res.data || [];
      setTemplateItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    fetchTemplateItems(template.PMENUTPLID || template.MENUTPLID);
  };

  const handleRemoveDetail = async (dtId) => {
    try {
      await menuTemplateApi.removeTemplateDetail(selectedTemplate.MENUTPLID || selectedTemplate.PMENUTPLID, dtId);
      fetchTemplateItems(selectedTemplate.MENUTPLID || selectedTemplate.PMENUTPLID);
    } catch (err) {
      console.error(err);
    }
  };

  const currentCanteenId = activeCanteenId || user?.CANTEENROLES?.[0]?.CANTEENID;

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* ── ISRO Hero Banner ── */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        {/* Abstract background glow accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Menu Templates</h1>
            </div>
            <p className="text-blue-100/70 text-sm max-w-xl">
              Configure reusable meal templates by service and weekday, and generate week menus in bulk.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/20 transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Bulk Generate
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Split Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Card: Templates List (col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Templates</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {templates.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Select to inspect</span>
          </div>

          <div className="p-4 space-y-2.5 max-h-[calc(100vh-22rem)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs py-12">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                Loading templates…
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                <p className="font-bold text-slate-600">No Templates Configured</p>
                <p>Click <strong>"+ New Template"</strong> to create a template with the Smart Draft Generator.</p>
              </div>
            ) : (
              templates.map((tpl) => {
                const id = tpl.PMENUTPLID || tpl.MENUTPLID;
                const isSelected = selectedTemplate && (selectedTemplate.PMENUTPLID || selectedTemplate.MENUTPLID) === id;
                const dayName = DAY_NAMES[tpl.WEEKDAY || tpl.DAYOFWEEK] || 'Ad-hoc / All Days';
                return (
                  <div
                    key={id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-1 ring-orange-400/40'
                        : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50/50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-sm text-slate-800 truncate">{tpl.TPLNAME}</h3>
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {tpl.SERVNAME || `Service #${tpl.SERVICEID}`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex justify-between items-center">
                      <span className="font-mono text-[11px] text-slate-600">📅 {dayName}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                        {tpl.STATUSCODE || tpl.STATUS || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Card: Template Details (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {selectedTemplate ? (
            <div className="space-y-6">
              {/* Template Card Header */}
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                      {selectedTemplate.SERVNAME || `Service #${selectedTemplate.SERVICEID}`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                      📅 {DAY_NAMES[selectedTemplate.WEEKDAY || selectedTemplate.DAYOFWEEK] || 'Ad-hoc / All Days'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {selectedTemplate.TPLNAME}
                  </h2>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {templateItems.length} item{templateItems.length !== 1 ? 's' : ''} in template
                </div>
              </div>

              {/* Template Dishes Section */}
              <div className="p-6 pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Configured Dishes &amp; Constraints
                  </h3>
                </div>

                {templateItems.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs">No dishes configured in this template yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Dish / Item Code</th>
                          <th className="px-3 py-3 text-center">Pre-Book</th>
                          <th className="px-3 py-3 text-center">Kiosk</th>
                          <th className="px-3 py-3 text-center">Special</th>
                          <th className="px-3 py-3 text-center">Max Qty</th>
                          <th className="px-3 py-3 text-center">Default Limit</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {templateItems.map((item) => (
                          <tr key={item.MENUTPLDTID || item.TPLDTID || item.MENUITEMID} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              <div>{item.ITEMNAME || `Menu Item #${item.MENUITEMID}`}</div>
                              <div className="text-[11px] text-slate-400 font-mono font-normal">{item.MENUCODE || item.SHORTNAME}</div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.ISPREBOOK ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                                {item.ISPREBOOK ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.ISKIOSK ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                                {item.ISKIOSK ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {item.ISSPECIAL ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  SPECIAL
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-slate-700">
                              {item.MAXQTY || 1}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-slate-700">
                              {item.DEFAVAILQTY || '∞'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveDetail(item.MENUTPLDTID || item.TPLDTID)}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-600 text-sm">No Template Selected</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Select a template on the left to view dishes, or click <strong>"+ New Template"</strong> to create one.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <TemplateCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        canteenId={currentCanteenId}
        onComplete={fetchTemplates}
      />

      <BulkGenerateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        canteenId={currentCanteenId}
        onComplete={fetchTemplates}
      />
    </div>
  );
}

