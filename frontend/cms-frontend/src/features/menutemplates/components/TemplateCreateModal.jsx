import { useState, useEffect } from 'react';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';
import { menuTemplateApi } from '../api/menuTemplateApi';
import { getServices } from '../../services/api/servicesApi';
import { getMenuItems } from '../../menu/api/menuApi';

export function TemplateCreateModal({ isOpen, onClose, canteenId, onComplete }) {
  const [tplName, setTplName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState([]);
  const [weekday, setWeekday] = useState(1);
  const [draftCount, setDraftCount] = useState(6);
  const [items, setItems] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState('');

  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTplName('');
      setItems([]);
      setSelectedCatalogItem('');

      // Fetch services & menu catalog
      Promise.all([
        getServices().catch(() => []),
        getMenuItems().catch(() => []),
      ]).then(([sData, mData]) => {
        const sList = Array.isArray(sData) ? sData : [];
        setServices(sList);
        if (sList.length > 0) setServiceId(sList[0].SERVICEID);

        const mList = Array.isArray(mData) ? mData : (Array.isArray(mData?.data?.DATA) ? mData.data.DATA : []);
        setCatalogItems(mList);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAutoDraft = async () => {
    if (!serviceId) {
      setError('Please select a service first.');
      return;
    }

    try {
      setDrafting(true);
      setError(null);
      const res = await menuTemplateApi.generateTemplateDraft({
        canteenId: canteenId ? Number(canteenId) : undefined,
        serviceId: Number(serviceId),
        count: Number(draftCount) || 6,
      });

      const draftItems = res.data?.DATA || res.data || [];
      if (draftItems.length === 0) {
        setError('No active menu items found for this service category or generic pool.');
      } else {
        setItems(
          draftItems.map((d) => ({
            MENUITEMID: d.MENUITEMID,
            MENUCODE: d.MENUCODE,
            ITEMNAME: d.ITEMNAME,
            SHORTNAME: d.SHORTNAME,
            SERVNAME: d.SERVNAME,
            ISSPECIAL: d.ISSPECIAL ?? 0,
            ISPREBOOK: d.ISPREBOOK ?? 1,
            ISKIOSK: d.ISKIOSK ?? 1,
            MAXQTY: d.MAXQTY ?? 1,
            DEFAVAILQTY: d.DEFAVAILQTY ?? 100,
          }))
        );
      }
    } catch (err) {
      setError(err.response?.data?.MESSAGE || 'Failed to generate template draft.');
    } finally {
      setDrafting(false);
    }
  };

  const handleAddCatalogItem = () => {
    if (!selectedCatalogItem) return;
    const found = catalogItems.find((c) => String(c.MENUITEMID) === String(selectedCatalogItem));
    if (!found) return;

    if (items.some((i) => i.MENUITEMID === found.MENUITEMID)) {
      setError(`"${found.ITEMNAME}" is already added to this template.`);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        MENUITEMID: found.MENUITEMID,
        MENUCODE: found.MENUCODE,
        ITEMNAME: found.ITEMNAME,
        SHORTNAME: found.SHORTNAME,
        SERVNAME: found.SERVNAME,
        ISSPECIAL: found.ISSPECIAL ?? 0,
        ISPREBOOK: 1,
        ISKIOSK: 1,
        MAXQTY: 1,
        DEFAVAILQTY: 100,
      },
    ]);
    setSelectedCatalogItem('');
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!tplName.trim()) {
      setError('Template name is required.');
      return;
    }
    if (!serviceId) {
      setError('Service is required.');
      return;
    }
    if (items.length === 0) {
      setError('At least one menu item is required in the template.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Create Template Header
      const createRes = await menuTemplateApi.createTemplate({
        PCANTEENID: Number(canteenId),
        PSERVICEID: Number(serviceId),
        PTPLNAME: tplName.trim(),
        PWEEKDAY: Number(weekday),
      });

      const templateId =
        createRes.data?.DATA?.MENUTPLID ||
        createRes.data?.MENUTPLID ||
        createRes.data?.DATA?.id ||
        createRes.data?.id;

      if (!templateId) {
        throw new Error('Failed to retrieve created template ID.');
      }

      // 2. Add Detail items
      for (const item of items) {
        await menuTemplateApi.addTemplateDetail(templateId, {
          PMENUITEMID: item.MENUITEMID,
          PISSPECIAL: item.ISSPECIAL ? 1 : 0,
          PISPREBOOK: item.ISPREBOOK ? 1 : 0,
          PISKIOSK: item.ISKIOSK ? 1 : 0,
          PMAXQTY: Number(item.MAXQTY) || 1,
          PDEFAVAILQTY: Number(item.DEFAVAILQTY) || 0,
        });
      }

      onComplete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.MESSAGE || err.message || 'Failed to save template.');
    } finally {
      setLoading(false);
    }
  };

  const WEEKDAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 7, name: 'Sunday' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-neutral-800 bg-[#0F172A] text-white flex justify-between items-center">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-orange-500 text-slate-950 font-grotesk tracking-wide">
              MENU PLANNING
            </span>
            <h2 className="text-xl font-black font-grotesk mt-1 text-white">Create Menu Template</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Form Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="e.g. Wednesday South Indian Lunch"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Service Category *
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                {services.map((s) => (
                  <option key={s.SERVICEID} value={s.SERVICEID}>
                    {s.SERVNAME} ({s.SERVCODE})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Day of Week
              </label>
              <select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                {WEEKDAYS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Smart Draft Generator Card */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-neutral-800 dark:to-neutral-800/80 p-5 rounded-2xl border border-orange-200/80 dark:border-neutral-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-grotesk flex items-center gap-1.5">
                  <span>🎲</span> Smart Draft Generator
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Randomly sample active catalog items tagged for this service (and generic dishes) into this template.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={draftCount}
                  onChange={(e) => setDraftCount(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-orange-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-white"
                >
                  <option value="4">4 Dishes</option>
                  <option value="6">6 Dishes</option>
                  <option value="8">8 Dishes</option>
                  <option value="10">10 Dishes</option>
                </select>

                <button
                  type="button"
                  onClick={handleAutoDraft}
                  disabled={drafting || !serviceId}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {drafting ? (
                    "Sampling..."
                  ) : (
                    <>
                      <span>🎲</span> Auto-Draft Items
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Manual Item Add Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedCatalogItem}
              onChange={(e) => setSelectedCatalogItem(e.target.value)}
              className="flex-1 w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">+ Add specific dish from catalog...</option>
              {catalogItems.map((m) => (
                <option key={m.MENUITEMID} value={m.MENUITEMID}>
                  {m.ITEMNAME} ({m.MENUCODE}) — {m.SERVNAME || 'All Services'}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddCatalogItem}
              disabled={!selectedCatalogItem}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-neutral-700 text-white hover:bg-slate-800 disabled:opacity-40"
            >
              Add to Template
            </button>
          </div>

          {/* Assigned Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Template Dishes ({items.length})
              </h4>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-neutral-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-700 text-slate-400 text-xs">
                No items added yet. Click <strong>"Auto-Draft Items"</strong> or add dishes manually from the catalog.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-neutral-700">
                    <tr>
                      <th className="p-3">Dish / Code</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Pre-Book</th>
                      <th className="p-3 text-center">Kiosk</th>
                      <th className="p-3 text-center">Special</th>
                      <th className="p-3 text-center">Max Qty</th>
                      <th className="p-3 text-center">Avail Limit</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {items.map((item, idx) => (
                      <tr key={item.MENUITEMID || idx} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          <div>{item.ITEMNAME}</div>
                          <div className="text-[0.65rem] text-slate-400 font-mono">{item.MENUCODE}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                            {item.SERVNAME || 'All Services'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!item.ISPREBOOK}
                            onChange={(e) => handleUpdateItem(idx, 'ISPREBOOK', e.target.checked ? 1 : 0)}
                            className="w-4 h-4 rounded text-orange-500"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!item.ISKIOSK}
                            onChange={(e) => handleUpdateItem(idx, 'ISKIOSK', e.target.checked ? 1 : 0)}
                            className="w-4 h-4 rounded text-orange-500"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!item.ISSPECIAL}
                            onChange={(e) => handleUpdateItem(idx, 'ISSPECIAL', e.target.checked ? 1 : 0)}
                            className="w-4 h-4 rounded text-orange-500"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={item.MAXQTY}
                            onChange={(e) => handleUpdateItem(idx, 'MAXQTY', e.target.value)}
                            className="w-14 p-1 rounded-lg border border-slate-300 dark:border-neutral-700 text-center font-mono text-xs bg-white dark:bg-neutral-800 text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={item.DEFAVAILQTY}
                            onChange={(e) => handleUpdateItem(idx, 'DEFAVAILQTY', e.target.value)}
                            className="w-16 p-1 rounded-lg border border-slate-300 dark:border-neutral-700 text-center font-mono text-xs bg-white dark:bg-neutral-800 text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700 font-bold text-sm px-2 py-1"
                          >
                            ✕
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

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-neutral-800 border-t border-slate-200 dark:border-neutral-700 flex justify-end gap-3">
          <GhostBtn onClick={onClose} disabled={loading}>
            Cancel
          </GhostBtn>
          <PrimaryBtn onClick={handleSave} disabled={loading || items.length === 0}>
            {loading ? 'Saving Template...' : `Save Template (${items.length} dishes)`}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
