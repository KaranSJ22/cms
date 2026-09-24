import { useState, useEffect, useMemo } from 'react';
import api from '../../../config/axios';
import { useAuth } from '../../../hooks/useAuth';
import {
  getOfficialServices,
  createOfficialService,
  createOfficialCombo,
  updateOfficialCombo,
  deleteOfficialCombo,
  getOfficialMenuItems,
} from '../api/officialApi';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ServiceFormModal from '../components/services/ServiceFormModal';
import ServiceListCard from '../components/services/ServiceListCard';
import ComboStudioSection from '../components/services/ComboStudioSection';

/**
 * Official Services & Combos Management Page
 * Handles official catering categories, predefined combo bundles, and live costing studio
 */
export default function OfficialServicesManagerPage() {
  const { user, activeCanteenId, setActiveCanteenId } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState(
    activeCanteenId || ''
  );
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & In-Page Studio
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    SERVNAME: '',
    DESCR: '',
    CUTOFFHOURS: 24,
    REQAPPRLVL: 'L1',
  });
  const [showComboModal, setShowComboModal] = useState(null); // target serviceId (active in-page studio)
  const [editingComboId, setEditingComboId] = useState(null);
  const [comboForm, setComboForm] = useState({
    COMBONAME: '',
    DESCR: '',
    COMBOPRICE: 0,
    ITEMS: [],
  });
  const [handlingCharge, setHandlingCharge] = useState(0);
  const [availableItems, setAvailableItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCombos, setExpandedCombos] = useState({});

  const toggleExpandCombo = (serviceId, comboId) => {
    setExpandedCombos((prev) => {
      const current = prev[serviceId];
      return {
        ...prev,
        [serviceId]: current === comboId ? null : comboId,
      };
    });
  };

  // 1. Fetch Canteens and filter strictly by manager's assigned canteens
  useEffect(() => {
    api.get('/canteens').then((res) => {
      const list = res.data.DATA || [];
      const userCanteenIds = (user?.CANTEENROLES || []).map(
        (r) => r.CANTEENID
      );
      const hasAdminRole = (user?.SYSTEMROLES || []).includes('SYSADM');

      const allowed = hasAdminRole
        ? list
        : list.filter((c) => userCanteenIds.includes(c.CANTEENID));

      setCanteens(allowed);

      if (allowed.length > 0) {
        const isCurrentValid = allowed.some(
          (c) => c.CANTEENID === Number(selectedCanteenId)
        );
        if (!isCurrentValid) {
          const matched = allowed.find(
            (c) => c.CANTEENID === Number(activeCanteenId)
          );
          const targetId = matched ? matched.CANTEENID : allowed[0].CANTEENID;
          setSelectedCanteenId(targetId);
          if (!activeCanteenId) {
            setActiveCanteenId(targetId);
          }
        }
      }
    });
  }, [user]);

  // Keep selectedCanteenId in sync when activeCanteenId changes in header or sidebar
  useEffect(() => {
    if (
      activeCanteenId &&
      canteens.some((c) => c.CANTEENID === Number(activeCanteenId))
    ) {
      setSelectedCanteenId(Number(activeCanteenId));
    }
  }, [activeCanteenId, canteens]);

  // 2. Fetch Services when canteen changes
  const loadServices = async () => {
    if (!selectedCanteenId) return;
    try {
      setLoading(true);
      const data = await getOfficialServices(selectedCanteenId);
      setServices(data || []);
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [selectedCanteenId]);

  // 3. Load Menu Items for combo studio
  useEffect(() => {
    if (showComboModal) {
      setLoadingItems(true);
      getOfficialMenuItems(selectedCanteenId)
        .then((items) => setAvailableItems(items || []))
        .catch((err) => {
          console.error('Failed to load menu items', err);
          setAvailableItems([]);
        })
        .finally(() => setLoadingItems(false));
    }
  }, [showComboModal, selectedCanteenId]);

  // Calculations for In-Page Combo Studio
  const activeService = useMemo(() => {
    return services.find((s) => s.OFFSERVID === Number(showComboModal));
  }, [services, showComboModal]);

  const grossTotal = useMemo(() => {
    return comboForm.ITEMS.reduce(
      (sum, it) => sum + (Number(it.PRICE) || 0) * (Number(it.QTY) || 1),
      0
    );
  }, [comboForm.ITEMS]);

  const totalPortions = useMemo(() => {
    return comboForm.ITEMS.reduce((sum, it) => sum + (Number(it.QTY) || 1), 0);
  }, [comboForm.ITEMS]);

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createOfficialService({
        CANTEENID: Number(selectedCanteenId),
        SERVNAME: serviceForm.SERVNAME.trim(),
        DESCR: serviceForm.DESCR.trim(),
        CUTOFFHOURS: Number(serviceForm.CUTOFFHOURS),
        REQAPPRLVL: serviceForm.REQAPPRLVL || 'L1',
      });
      setShowServiceModal(false);
      setServiceForm({
        SERVNAME: '',
        DESCR: '',
        CUTOFFHOURS: 24,
        REQAPPRLVL: 'L1',
      });
      loadServices();
    } catch (err) {
      alert(
        err.response?.data?.MESSAGE ||
          err.message ||
          'Failed to create service'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenComboStudio = (serviceId) => {
    setEditingComboId(null);
    setShowComboModal(serviceId);
    setComboForm({ COMBONAME: '', DESCR: '', COMBOPRICE: 0, ITEMS: [] });
    setHandlingCharge(0);
  };

  const handleOpenEditCombo = (serviceId, combo) => {
    setEditingComboId(combo.OFFCOMBOID);
    setShowComboModal(serviceId);
    setComboForm({
      COMBONAME: combo.COMBONAME,
      DESCR: combo.DESCR || '',
      COMBOPRICE: combo.COMBOPRICE || combo.GROSSPRICE || 0,
      ITEMS: (combo.ITEMS || []).map((it) => ({
        MENUITEMID: it.MENUITEMID,
        MENUNAME: it.MENUNAME || it.ITEMNAME,
        PRICE: Number(it.OFFPRICE || it.UNITPRICE || 0),
        QTY: it.QTY || 1,
        CATCODE: it.CATCODE || 'Item',
      })),
    });
    setHandlingCharge(Number(combo.HANDLINGCHARGE || 0));
  };

  const handleDeleteCombo = async (comboId, comboName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the combo "${comboName}"?`
      )
    )
      return;
    try {
      setSubmitting(true);
      await deleteOfficialCombo(comboId);
      await loadServices();
    } catch (err) {
      alert(
        err.response?.data?.MESSAGE || err.message || 'Failed to delete combo'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCombo = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!comboForm.COMBONAME.trim()) {
      alert('Please enter a Combo Package Name');
      return;
    }
    if (!comboForm.ITEMS || comboForm.ITEMS.length === 0) {
      alert('Please add at least one menu item to the combo');
      return;
    }
    if (!comboForm.COMBOPRICE || Number(comboForm.COMBOPRICE) <= 0) {
      alert('Please enter a valid Combo Unit Price');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        OFFSERVID: Number(showComboModal),
        COMBONAME: comboForm.COMBONAME.trim(),
        DESCR: comboForm.DESCR.trim(),
        GROSSPRICE: Number(grossTotal.toFixed(2)),
        HANDLINGCHARGE: Number(handlingCharge.toFixed(2)),
        COMBOPRICE: Number(comboForm.COMBOPRICE),
        ITEMS: comboForm.ITEMS.map((it) => ({
          MENUITEMID: it.MENUITEMID,
          QTY: it.QTY || 1,
        })),
      };

      if (editingComboId) {
        await updateOfficialCombo(editingComboId, payload);
      } else {
        await createOfficialCombo(payload);
      }

      setShowComboModal(null);
      setEditingComboId(null);
      setComboForm({ COMBONAME: '', DESCR: '', COMBOPRICE: 0, ITEMS: [] });
      setHandlingCharge(0);
      await loadServices();
    } catch (err) {
      alert(
        err.response?.data?.MESSAGE || err.message || 'Failed to save combo'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const addItemToCombo = (itemOrId) => {
    const item =
      typeof itemOrId === 'object'
        ? itemOrId
        : availableItems.find((i) => i.MENUITEMID === Number(itemOrId));
    if (!item) return;
    if (comboForm.ITEMS.some((i) => i.MENUITEMID === item.MENUITEMID)) return;
    const displayName =
      item.ITEMNAME || item.MENUNAME || item.SHORTNAME || 'Item';
    const itemPrice = Number(item.UNITPRICE || item.OFFPRICE || 0);

    setComboForm((prev) => {
      const newItems = [
        ...prev.ITEMS,
        {
          MENUITEMID: item.MENUITEMID,
          MENUNAME: displayName,
          PRICE: itemPrice,
          QTY: 1,
        },
      ];
      const newGross = newItems.reduce(
        (sum, it) => sum + (Number(it.PRICE) || 0) * (Number(it.QTY) || 1),
        0
      );
      return {
        ...prev,
        ITEMS: newItems,
        COMBOPRICE: prev.COMBOPRICE === 0 ? newGross : prev.COMBOPRICE,
      };
    });
  };

  const removeItemFromCombo = (menuItemId) => {
    setComboForm((prev) => {
      const newItems = prev.ITEMS.filter((i) => i.MENUITEMID !== menuItemId);
      const newGross = newItems.reduce(
        (sum, it) => sum + (Number(it.PRICE) || 0) * (Number(it.QTY) || 1),
        0
      );
      return {
        ...prev,
        ITEMS: newItems,
        COMBOPRICE: prev.COMBOPRICE === 0 ? newGross : prev.COMBOPRICE,
      };
    });
  };

  const updateItemQty = (menuItemId, qty) => {
    setComboForm((prev) => {
      const newItems = prev.ITEMS.map((i) =>
        i.MENUITEMID === menuItemId
          ? { ...i, QTY: Math.max(1, Number(qty)) }
          : i
      );
      return {
        ...prev,
        ITEMS: newItems,
      };
    });
  };

  const handleHandlingChange = (val) => {
    const charge = Math.max(0, Number(val) || 0);
    setHandlingCharge(charge);
  };

  const handleSyncSuggestedPrice = () => {
    setComboForm((prev) => ({
      ...prev,
      COMBOPRICE: grossTotal,
    }));
  };

  const activeCanteenObj = canteens.find(
    (c) => c.CANTEENID === Number(selectedCanteenId)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* VIEW 1: IN-PAGE COMBO CREATION STUDIO */}
      {showComboModal ? (
        <ComboStudioSection
          activeService={activeService}
          editingComboId={editingComboId}
          comboForm={comboForm}
          setComboForm={setComboForm}
          handlingCharge={handlingCharge}
          onHandlingChange={handleHandlingChange}
          grossTotal={grossTotal}
          totalPortions={totalPortions}
          availableItems={availableItems}
          loadingItems={loadingItems}
          submitting={submitting}
          onAddItem={addItemToCombo}
          onRemoveItem={removeItemFromCombo}
          onUpdateQty={updateItemQty}
          onSyncSuggestedPrice={handleSyncSuggestedPrice}
          onSaveCombo={handleSaveCombo}
          onClose={() => {
            setShowComboModal(null);
            setEditingComboId(null);
          }}
        />
      ) : (
        /* VIEW 2: SERVICES & COMBOS OVERVIEW LIST */
        <div>
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-grotesk">
                Official Services &amp; Combos
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configure official catering categories, predefined combo bundles,
                and lead-time cutoffs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedCanteenId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedCanteenId(val);
                  setActiveCanteenId(val);
                }}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {canteens.map((c) => (
                  <option
                    key={c.CANTEENID}
                    value={c.CANTEENID}
                    className="bg-slate-900 text-white"
                  >
                    {c.CANTEENNAME} ({c.CANTEENCODE})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowServiceModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Service</span>
              </button>
            </div>
          </div>

          {/* Services List */}
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <SparklesIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No Official Services configured
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Click &apos;New Service&apos; to create an official catering category
                (e.g. Official Meeting Snack, Conference Lunch).
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {services.map((svc) => (
                <ServiceListCard
                  key={svc.OFFSERVID}
                  svc={svc}
                  expandedCombos={expandedCombos}
                  onToggleExpandCombo={toggleExpandCombo}
                  onAddComboClick={handleOpenComboStudio}
                  onEditComboClick={handleOpenEditCombo}
                  onDeleteComboClick={handleDeleteCombo}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Official Service Modal */}
      <ServiceFormModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        canteenName={activeCanteenObj?.CANTEENNAME}
        canteenCode={activeCanteenObj?.CANTEENCODE}
        submitting={submitting}
        onSubmit={handleCreateService}
      />
    </div>
  );
}
