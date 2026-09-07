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
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-neutral-900 font-inter">
      {/* Left Pane: Templates List */}
      <div className="w-1/3 border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white font-grotesk">Menu Templates</h2>
            <p className="text-[0.65rem] text-slate-400">Reusable daily / weekly menus</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition-all shadow-sm flex items-center gap-1"
            >
              <span>+</span> New
            </button>
            <PrimaryBtn onClick={() => setIsBulkModalOpen(true)}>Bulk Gen</PrimaryBtn>
          </div>
        </div>

        <div className="p-4 space-y-2 flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-neutral-500 text-xs text-center py-8">Loading templates...</p>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-neutral-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-700 text-slate-400 text-xs space-y-2">
              <p className="font-bold text-slate-600 dark:text-slate-300">No Templates Configured</p>
              <p>Click <strong>"+ New"</strong> to create a template with the Smart Draft Generator.</p>
            </div>
          ) : (
            templates.map((tpl) => {
              const id = tpl.PMENUTPLID || tpl.MENUTPLID;
              const isSelected =
                selectedTemplate && (selectedTemplate.PMENUTPLID || selectedTemplate.MENUTPLID) === id;
              const dayName = DAY_NAMES[tpl.WEEKDAY || tpl.DAYOFWEEK] || 'Ad-hoc / All Days';
              return (
                <div
                  key={id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all duration-200 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{tpl.TPLNAME}</h3>
                    <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                      {tpl.SERVNAME || `Service #${tpl.SERVICEID}`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 flex justify-between items-center">
                    <span className="font-mono text-[0.7rem]">📅 {dayName}</span>
                    <span className="text-[0.65rem] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      {tpl.STATUSCODE || tpl.STATUS || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Template Details */}
      <div className="w-2/3 bg-slate-50 dark:bg-neutral-900/50 p-6 md:p-8 overflow-y-auto">
        {selectedTemplate ? (
          <div className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl shadow-sm p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-start pb-6 border-b border-slate-100 dark:border-neutral-700">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                  {selectedTemplate.SERVNAME || `Service #${selectedTemplate.SERVICEID}`}
                </span>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white font-grotesk mt-1">
                  {selectedTemplate.TPLNAME}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned Day: <strong>{DAY_NAMES[selectedTemplate.WEEKDAY || selectedTemplate.DAYOFWEEK] || 'Ad-hoc'}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assigned Menu Dishes ({templateItems.length})
              </h3>

              {templateItems.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-700">
                  <p className="text-slate-400 text-xs">No items in this template yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-neutral-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/75 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-neutral-700">
                      <tr>
                        <th className="p-3">Dish / Code</th>
                        <th className="p-3 text-center">Pre-Book</th>
                        <th className="p-3 text-center">Kiosk</th>
                        <th className="p-3 text-center">Special</th>
                        <th className="p-3 text-center">Max Qty</th>
                        <th className="p-3 text-center">Default Limit</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                      {templateItems.map((item) => (
                        <tr key={item.MENUTPLDTID || item.TPLDTID || item.MENUITEMID} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            <div>{item.ITEMNAME || `Menu Item #${item.MENUITEMID}`}</div>
                            <div className="text-[0.65rem] text-slate-400 font-mono">{item.MENUCODE || item.SHORTNAME}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${item.ISPREBOOK ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                              {item.ISPREBOOK ? 'YES' : 'NO'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${item.ISKIOSK ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                              {item.ISKIOSK ? 'YES' : 'NO'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {item.ISSPECIAL ? (
                              <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold bg-amber-100 text-amber-800">
                                SPECIAL
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.MAXQTY || 1}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.DEFAVAILQTY || 0}
                          </td>
                          <td className="p-3 text-right">
                            <GhostBtn
                              onClick={() => handleRemoveDetail(item.MENUTPLDTID || item.TPLDTID)}
                              className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-xs px-2 py-1"
                            >
                              Remove
                            </GhostBtn>
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
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            <p>Select a template on the left to view details, or click <strong>"+ New"</strong> to build one with Smart Draft.</p>
          </div>
        )}
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

