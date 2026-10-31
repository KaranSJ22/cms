import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { canteenService } from '../api/canteenService';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';

export default function CanteenFacilitiesPage() {
  const [activeTab, setActiveTab] = useState('CANTEENS'); // 'CANTEENS' | 'CENTERS'

  const [canteens, setCanteens] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenterId, setSelectedCenterId] = useState('');

  // Modals
  const [showCanteenModal, setShowCanteenModal] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState(null);
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form States
  const [canteenForm, setCanteenForm] = useState({
    CENTERID: '',
    CANTEENCODE: '',
    CANTEENNAME: '',
    LOCATION: '',
  });

  const [centerForm, setCenterForm] = useState({
    CENTERCODE: '',
    CENTERNAME: '',
    LOCATION: '',
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [canteenList, centerList] = await Promise.all([
        canteenService.getCanteens(),
        canteenService.getCenters(),
      ]);

      setCanteens(canteenList);
      setCenters(centerList);
    } catch (err) {
      console.error('Failed to load canteens or campus centers:', err);
      setError(err.response?.data?.MESSAGE || 'Failed to load canteen facilities.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Statistics
  const stats = useMemo(() => {
    const totalCanteens = canteens.length;
    const activeCanteens = canteens.filter((c) => c.STATUSID === 10).length;
    const totalCenters = centers.length;

    return {
      totalCanteens,
      activeCanteens,
      totalCenters,
    };
  }, [canteens, centers]);

  // Filtered Canteens
  const filteredCanteens = useMemo(() => {
    return canteens.filter((c) => {
      if (selectedCenterId && String(c.CENTERID) !== String(selectedCenterId)) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchCode = (c.CANTEENCODE || '').toLowerCase().includes(query);
        const matchName = (c.CANTEENNAME || '').toLowerCase().includes(query);
        const matchLoc = (c.LOCATION || '').toLowerCase().includes(query);
        const matchCenter = (c.CENTERNAME || '').toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchLoc && !matchCenter) return false;
      }
      return true;
    });
  }, [canteens, searchQuery, selectedCenterId]);

  // Filtered Centers
  const filteredCenters = useMemo(() => {
    if (!searchQuery.trim()) return centers;
    const query = searchQuery.toLowerCase().trim();
    return centers.filter((ctr) => {
      const matchCode = (ctr.CENTERCODE || '').toLowerCase().includes(query);
      const matchName = (ctr.CENTERNAME || '').toLowerCase().includes(query);
      const matchLoc = (ctr.LOCATION || '').toLowerCase().includes(query);
      return matchCode || matchName || matchLoc;
    });
  }, [centers, searchQuery]);

  // Handlers for Canteen Modal
  const handleOpenRegisterCanteen = () => {
    setEditingCanteen(null);
    setFormError(null);
    setCanteenForm({
      CENTERID: centers[0]?.CENTERID || '',
      CANTEENCODE: '',
      CANTEENNAME: '',
      LOCATION: '',
    });
    setShowCanteenModal(true);
  };

  const handleOpenEditCanteen = (canteen) => {
    setEditingCanteen(canteen);
    setFormError(null);
    setCanteenForm({
      CENTERID: canteen.CENTERID || '',
      CANTEENCODE: canteen.CANTEENCODE || '',
      CANTEENNAME: canteen.CANTEENNAME || '',
      LOCATION: canteen.LOCATION || '',
    });
    setShowCanteenModal(true);
  };

  const handleSubmitCanteen = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!canteenForm.CANTEENNAME.trim()) {
      setFormError('Canteen facility name is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCanteen) {
        await canteenService.updateCanteen(editingCanteen.CANTEENID, {
          CANTEENNAME: canteenForm.CANTEENNAME.trim(),
          LOCATION: canteenForm.LOCATION.trim() || null,
          STATUSCODE: editingCanteen.STATUSCODE || 'ACT',
        });
      } else {
        if (!canteenForm.CENTERID) {
          setFormError('Campus Center is required.');
          return;
        }
        if (!canteenForm.CANTEENCODE.trim()) {
          setFormError('Canteen Code is required.');
          return;
        }

        await canteenService.createCanteen({
          CENTERID: Number(canteenForm.CENTERID),
          CANTEENCODE: canteenForm.CANTEENCODE.trim().toUpperCase(),
          CANTEENNAME: canteenForm.CANTEENNAME.trim(),
          LOCATION: canteenForm.LOCATION.trim() || null,
        });
      }

      setShowCanteenModal(false);
      await fetchData(true);
    } catch (err) {
      console.error('Failed to save canteen facility:', err);
      setFormError(err.response?.data?.MESSAGE || 'Failed to save canteen facility.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateCanteen = async (canteen) => {
    if (!window.confirm(`Are you sure you want to deactivate canteen "${canteen.CANTEENNAME}"?`)) {
      return;
    }

    try {
      await canteenService.deactivateCanteen(canteen.CANTEENID);
      await fetchData(true);
    } catch (err) {
      alert(err.response?.data?.MESSAGE || 'Failed to deactivate canteen.');
    }
  };

  // Handlers for Center Modal
  const handleOpenAddCenter = () => {
    setFormError(null);
    setCenterForm({
      CENTERCODE: '',
      CENTERNAME: '',
      LOCATION: '',
    });
    setShowCenterModal(true);
  };

  const handleSubmitCenter = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!centerForm.CENTERCODE.trim()) {
      setFormError('Campus Center Code is required.');
      return;
    }
    if (!centerForm.CENTERNAME.trim()) {
      setFormError('Campus Center Name is required.');
      return;
    }

    try {
      setSubmitting(true);
      await canteenService.createCenter({
        CENTERCODE: centerForm.CENTERCODE.trim().toUpperCase(),
        CENTERNAME: centerForm.CENTERNAME.trim(),
        LOCATION: centerForm.LOCATION.trim() || null,
      });

      setShowCenterModal(false);
      await fetchData(true);
    } catch (err) {
      console.error('Failed to create campus center:', err);
      setFormError(err.response?.data?.MESSAGE || 'Failed to register campus center.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-inter">
      {/* ── Page Header (Stripe Clean Canvas) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 lg:px-8 py-5 bg-white border-b border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BuildingOffice2Icon className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold font-grotesk text-slate-900 tracking-tight">
              Canteen & Campus Infrastructure
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Campus centres, dining facilities, and catering locations across ISRO complexes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            title="Refresh Facilities"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold font-grotesk bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 transition-colors shadow-xs disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddCenter}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold font-grotesk bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 transition-colors shadow-xs"
          >
            <PlusIcon className="w-4 h-4 text-slate-500" />
            <span>Add Centre</span>
          </button>
          <PrimaryBtn onClick={handleOpenRegisterCanteen} className="!w-auto">
            <PlusIcon className="w-4 h-4" />
            <span>Register Canteen</span>
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider font-grotesk text-slate-500 mb-1">
              Dining Facilities
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900">
              {stats.totalCanteens}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.activeCanteens} currently active & serving
            </div>
          </div>

          <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs bg-emerald-50/20">
            <div className="text-xs font-semibold uppercase tracking-wider font-grotesk text-emerald-700 mb-1">
              Operational Facilities
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-emerald-700">
              {stats.activeCanteens}
            </div>
            <div className="text-xs text-emerald-600 mt-1">Available for menu scheduling</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider font-grotesk text-slate-500 mb-1">
              Campus Complexes / Centres
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900">
              {stats.totalCenters}
            </div>
            <div className="text-xs text-slate-500 mt-1">Geographic campus divisions</div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation & Filters ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white px-4 rounded-t-xl shadow-xs gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('CANTEENS')}
              className={`py-3.5 font-bold text-xs sm:text-sm tracking-wide font-grotesk uppercase transition-colors relative ${
                activeTab === 'CANTEENS' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Canteen Facilities ({canteens.length})
              {activeTab === 'CANTEENS' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('CENTERS')}
              className={`py-3.5 font-bold text-xs sm:text-sm tracking-wide font-grotesk uppercase transition-colors relative ${
                activeTab === 'CENTERS' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Campus Centres ({centers.length})
              {activeTab === 'CENTERS' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />
              )}
            </button>
          </div>

          {/* Search / Filter */}
          <div className="flex items-center gap-2 py-2">
            <div className="relative min-w-[200px]">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'CANTEENS' ? 'Search canteens...' : 'Search centres...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              />
            </div>

            {activeTab === 'CANTEENS' && (
              <select
                value={selectedCenterId}
                onChange={(e) => setSelectedCenterId(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 transition-colors"
              >
                <option value="">All Centres</option>
                {centers.map((c) => (
                  <option key={c.CENTERID} value={c.CENTERID}>
                    {c.CENTERCODE}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── Table Content ── */}
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl shadow-xs overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-3" />
              <p className="text-sm font-grotesk font-semibold text-slate-700">Loading infrastructure data...</p>
            </div>
          ) : activeTab === 'CANTEENS' ? (
            filteredCanteens.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <BuildingOffice2Icon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-grotesk font-semibold text-slate-700">No canteen facilities found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or register a new facility.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-[0.72rem] font-bold uppercase tracking-wider text-slate-500 font-grotesk">
                    <tr>
                      <th className="py-3 px-4">Facility Code & Name</th>
                      <th className="py-3 px-4">Campus Centre</th>
                      <th className="py-3 px-4">Physical Location</th>
                      <th className="py-3 px-4">State</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredCanteens.map((canteen) => {
                      const isActive = canteen.STATUSID === 10;
                      return (
                        <tr key={canteen.CANTEENID} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                                <BuildingOffice2Icon className="w-4 h-4 text-orange-600" />
                              </div>
                              <div>
                                <div className="font-bold font-grotesk text-slate-900">
                                  {canteen.CANTEENNAME}
                                </div>
                                <div className="font-mono text-[0.72rem] text-slate-500">
                                  {canteen.CANTEENCODE}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">
                              {canteen.CENTERNAME || 'Main Campus'}
                            </div>
                            <div className="font-mono text-[0.70rem] text-slate-500">
                              {canteen.CENTERCODE}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {canteen.LOCATION ? (
                              <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{canteen.LOCATION}</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic">Location unassigned</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.70rem] font-bold font-grotesk bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                Operational
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.70rem] font-bold font-grotesk bg-slate-100 text-slate-600 border border-slate-200">
                                <XCircleIcon className="w-3.5 h-3.5 text-slate-500" />
                                Deactivated
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditCanteen(canteen)}
                                title="Edit Canteen Details"
                                className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded transition-colors"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>

                              {isActive && (
                                <button
                                  onClick={() => handleDeactivateCanteen(canteen)}
                                  title="Deactivate Canteen Facility"
                                  className="text-[0.70rem] font-semibold font-grotesk px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Campus Centers View
            filteredCenters.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <MapPinIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-grotesk font-semibold text-slate-700">No campus centres found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-[0.72rem] font-bold uppercase tracking-wider text-slate-500 font-grotesk">
                    <tr>
                      <th className="py-3 px-4">Centre Code & Name</th>
                      <th className="py-3 px-4">Geographic Location</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredCenters.map((ctr) => (
                      <tr key={ctr.CENTERID} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold font-grotesk text-slate-900">{ctr.CENTERNAME}</div>
                          <div className="font-mono text-[0.70rem] text-slate-500">{ctr.CENTERCODE}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {ctr.LOCATION || <span className="text-slate-300 italic">Campus location</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.70rem] font-bold font-grotesk bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Modal: Register / Edit Canteen ── */}
      {showCanteenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <BuildingOffice2Icon className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold font-grotesk">
                  {editingCanteen ? `Edit Facility: ${editingCanteen.CANTEENCODE}` : 'Register Canteen Facility'}
                </h3>
              </div>
              <button
                onClick={() => setShowCanteenModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitCanteen} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs sm:text-sm">
                  {formError}
                </div>
              )}

              {!editingCanteen && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                      Campus Centre *
                    </label>
                    <select
                      required
                      value={canteenForm.CENTERID}
                      onChange={(e) => setCanteenForm({ ...canteenForm, CENTERID: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-colors"
                    >
                      <option value="">Select Campus Centre</option>
                      {centers.map((ctr) => (
                        <option key={ctr.CENTERID} value={ctr.CENTERID}>
                          {ctr.CENTERCODE} - {ctr.CENTERNAME}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                      Canteen Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={canteenForm.CANTEENCODE}
                      onChange={(e) =>
                        setCanteenForm({ ...canteenForm, CANTEENCODE: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. CAN-D"
                      className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Canteen Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={canteenForm.CANTEENNAME}
                  onChange={(e) => setCanteenForm({ ...canteenForm, CANTEENNAME: e.target.value })}
                  placeholder="e.g. Propulsion Wing Dining Hall"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Physical Location
                </label>
                <input
                  type="text"
                  value={canteenForm.LOCATION}
                  onChange={(e) => setCanteenForm({ ...canteenForm, LOCATION: e.target.value })}
                  placeholder="e.g. Building 22, Ground Floor"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <GhostBtn onClick={() => setShowCanteenModal(false)} disabled={submitting}>
                  Cancel
                </GhostBtn>
                <PrimaryBtn type="submit" loading={submitting} className="!w-auto">
                  {editingCanteen ? 'Save Changes' : 'Register Canteen'}
                </PrimaryBtn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Campus Centre ── */}
      {showCenterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold font-grotesk">Register Campus Centre</h3>
              </div>
              <button
                onClick={() => setShowCenterModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitCenter} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs sm:text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Centre Code *
                </label>
                <input
                  type="text"
                  required
                  value={centerForm.CENTERCODE}
                  onChange={(e) =>
                    setCenterForm({ ...centerForm, CENTERCODE: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. CEN-TERLS"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Centre Name *
                </label>
                <input
                  type="text"
                  required
                  value={centerForm.CENTERNAME}
                  onChange={(e) => setCenterForm({ ...centerForm, CENTERNAME: e.target.value })}
                  placeholder="e.g. Thumba Equatorial Rocket Launching Station"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={centerForm.LOCATION}
                  onChange={(e) => setCenterForm({ ...centerForm, LOCATION: e.target.value })}
                  placeholder="e.g. Thiruvananthapuram, Kerala"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <GhostBtn onClick={() => setShowCenterModal(false)} disabled={submitting}>
                  Cancel
                </GhostBtn>
                <PrimaryBtn type="submit" loading={submitting} className="!w-auto">
                  Register Centre
                </PrimaryBtn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
