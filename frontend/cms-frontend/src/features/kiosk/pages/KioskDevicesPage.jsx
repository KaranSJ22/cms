import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ComputerDesktopIcon,
  DeviceTabletIcon,
  SignalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { kioskDeviceService } from '../api/kioskDeviceService';
import { canteenService } from '../../canteen/api/canteenService';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';

function getDeviceHeartbeatStatus(lastHeartbeatAt) {
  if (!lastHeartbeatAt) {
    return { status: 'OFFLINE', label: 'Never Connected', color: 'slate', dot: 'bg-slate-400' };
  }

  const diffMs = Date.now() - new Date(lastHeartbeatAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 3) {
    return {
      status: 'ONLINE',
      label: diffMins <= 0 ? 'Active (Just now)' : `Active (${diffMins}m ago)`,
      color: 'emerald',
      dot: 'bg-emerald-500 animate-pulse',
    };
  }
  if (diffMins <= 10) {
    return {
      status: 'STALE',
      label: `Stale (${diffMins}m ago)`,
      color: 'amber',
      dot: 'bg-amber-500',
    };
  }
  return {
    status: 'OFFLINE',
    label: diffMins >= 1440 ? `Offline (${Math.floor(diffMins / 1440)}d ago)` : `Offline (${Math.floor(diffMins / 60)}h ago)`,
    color: 'rose',
    dot: 'bg-rose-500',
  };
}

export default function KioskDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCanteenId, setSelectedCanteenId] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    DEVICECODE: '',
    DEVICENAME: '',
    CANTEENID: '',
    KIOSKTYPE: 'STAFF_COUNTER',
    IPADDRESS: '',
    MACADDRESS: '',
    LOCATION: '',
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [deviceList, canteenList, telemetryData] = await Promise.all([
        kioskDeviceService.getDevices(),
        canteenService.getCanteens(),
        kioskDeviceService.getTelemetry().catch(() => null),
      ]);

      setDevices(deviceList);
      setCanteens(canteenList);
      setTelemetry(telemetryData);
    } catch (err) {
      console.error('Failed to load kiosk device fleet:', err);
      setError(err.response?.data?.MESSAGE || 'Failed to load kiosk hardware device fleet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute live counts
  const stats = useMemo(() => {
    let onlineCount = 0;
    let staleCount = 0;
    let offlineCount = 0;
    let staffCount = 0;
    let selfServiceCount = 0;

    devices.forEach((d) => {
      const hb = getDeviceHeartbeatStatus(d.LASTHEARTBEATAT);
      if (hb.status === 'ONLINE') onlineCount++;
      else if (hb.status === 'STALE') staleCount++;
      else offlineCount++;

      if (d.KIOSKTYPE === 'STAFF_COUNTER') staffCount++;
      else if (d.KIOSKTYPE === 'EMP_SELF_SERVICE') selfServiceCount++;
    });

    return {
      total: devices.length,
      online: onlineCount,
      stale: staleCount,
      offline: offlineCount,
      staffCount,
      selfServiceCount,
    };
  }, [devices]);

  // Filtered devices list
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = (device.DEVICECODE || '').toLowerCase().includes(query);
        const matchesName = (device.DEVICENAME || '').toLowerCase().includes(query);
        const matchesIp = (device.IPADDRESS || '').toLowerCase().includes(query);
        const matchesMac = (device.MACADDRESS || '').toLowerCase().includes(query);
        const matchesCanteen = (device.CANTEENNAME || '').toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesIp && !matchesMac && !matchesCanteen) {
          return false;
        }
      }

      // Canteen Filter
      if (selectedCanteenId && String(device.CANTEENID) !== String(selectedCanteenId)) {
        return false;
      }

      // Type Filter
      if (selectedType !== 'ALL' && device.KIOSKTYPE !== selectedType) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'ALL') {
        const hb = getDeviceHeartbeatStatus(device.LASTHEARTBEATAT);
        if (selectedStatus === 'ONLINE' && hb.status !== 'ONLINE') return false;
        if (selectedStatus === 'STALE' && hb.status !== 'STALE') return false;
        if (selectedStatus === 'OFFLINE' && hb.status !== 'OFFLINE') return false;
        const isDevActive = device.STATUSID === 10 || device.ISACTIVE === 1 || device.STATUSCODE === 'ACT';
        if (selectedStatus === 'DIS' && isDevActive) return false;
        if (selectedStatus === 'ACT' && !isDevActive) return false;
      }

      return true;
    });
  }, [devices, searchQuery, selectedCanteenId, selectedType, selectedStatus]);

  // Modal open helpers
  const handleOpenRegister = () => {
    setEditingDevice(null);
    setFormError(null);
    setFormData({
      DEVICECODE: '',
      DEVICENAME: '',
      CANTEENID: canteens[0]?.CANTEENID || '',
      KIOSKTYPE: 'STAFF_COUNTER',
      IPADDRESS: '',
      MACADDRESS: '',
      LOCATION: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (device) => {
    setEditingDevice(device);
    setFormError(null);
    setFormData({
      DEVICECODE: device.DEVICECODE || '',
      DEVICENAME: device.DEVICENAME || '',
      CANTEENID: device.CANTEENID || '',
      KIOSKTYPE: device.KIOSKTYPE || 'STAFF_COUNTER',
      IPADDRESS: device.IPADDRESS || '',
      MACADDRESS: device.MACADDRESS || '',
      LOCATION: device.LOCATION || '',
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.DEVICECODE.trim()) {
      setFormError('Terminal Device Code is required.');
      return;
    }
    if (!formData.DEVICENAME.trim()) {
      setFormError('Terminal Device Name is required.');
      return;
    }
    if (!formData.CANTEENID) {
      setFormError('Assigned Canteen is required.');
      return;
    }
    if (!formData.IPADDRESS.trim()) {
      setFormError('Static IP Address is required.');
      return;
    }

    try {
      setFormSubmitting(true);
      await kioskDeviceService.registerDevice({
        DEVICECODE: formData.DEVICECODE.trim().toUpperCase(),
        DEVICENAME: formData.DEVICENAME.trim(),
        CANTEENID: Number(formData.CANTEENID),
        KIOSKTYPE: formData.KIOSKTYPE,
        IPADDRESS: formData.IPADDRESS.trim(),
        MACADDRESS: formData.MACADDRESS.trim() || null,
        LOCATION: formData.LOCATION.trim() || null,
      });

      setShowModal(false);
      await fetchData(true);
    } catch (err) {
      console.error('Failed to register kiosk terminal:', err);
      setFormError(err.response?.data?.MESSAGE || 'Failed to save kiosk terminal configuration.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (device) => {
    const isCurrentlyActive = device.STATUSID === 10 || device.ISACTIVE === 1 || device.STATUSCODE === 'ACT';
    const nextStatusId = isCurrentlyActive ? 11 : 10;
    const actionLabel = nextStatusId === 10 ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} terminal ${device.DEVICECODE}?`)) {
      return;
    }

    try {
      await kioskDeviceService.updateStatus(device.KIOSKID, nextStatusId);
      await fetchData(true);
    } catch (err) {
      alert(err.response?.data?.MESSAGE || `Failed to ${actionLabel} terminal.`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-inter">
      {/* ── Page Header (Stripe Clean Canvas) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 lg:px-8 py-5 bg-white border-b border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ComputerDesktopIcon className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold font-grotesk text-slate-900 tracking-tight">
              Kiosk Terminal Fleet Management
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Physical hardware terminals, self-service kiosks, and counter devices across ISRO campus canteens.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            title="Refresh Fleet Telemetry"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold font-grotesk bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 transition-colors shadow-xs disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <PrimaryBtn onClick={handleOpenRegister} className="!w-auto">
            <PlusIcon className="w-4 h-4" />
            <span>Register Terminal</span>
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Fleet Telemetry Stat Cards ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Terminals */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">Total Fleet</span>
              <ComputerDesktopIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900">{stats.total}</div>
            <div className="text-[0.75rem] text-slate-500 mt-1">
              {stats.staffCount} Serving Counters | {stats.selfServiceCount} Self-Service
            </div>
          </div>

          {/* Card 2: Online & Active */}
          <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">Online Active</span>
              <SignalIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold font-grotesk text-emerald-700">{stats.online}</div>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-medium bg-emerald-100 text-emerald-800">
                &lt; 3m Heartbeat
              </span>
            </div>
            <div className="text-[0.75rem] text-emerald-600 mt-1">Ready for transaction serving</div>
          </div>

          {/* Card 3: Stale Telemetry */}
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs bg-amber-50/20">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">Stale Connection</span>
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold font-grotesk text-amber-700">{stats.stale}</div>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-medium bg-amber-100 text-amber-800">
                3-10m Window
              </span>
            </div>
            <div className="text-[0.75rem] text-amber-600 mt-1">Network delay or idle device</div>
          </div>

          {/* Card 4: Offline / Disconnected */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">Offline / Inactive</span>
              <XCircleIcon className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-700">{stats.offline}</div>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-medium bg-slate-100 text-slate-700">
                &gt; 10m Inactive
              </span>
            </div>
            <div className="text-[0.75rem] text-slate-500 mt-1">Powered off or network isolated</div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
           <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Device Code, Name, IP, or MAC..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Canteen Filter */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={selectedCanteenId}
              onChange={(e) => setSelectedCanteenId(e.target.value)}
              className="py-1.5 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 transition-colors"
            >
              <option value="">All Canteens</option>
              {canteens.map((c) => (
                <option key={c.CANTEENID} value={c.CANTEENID}>
                  {c.CANTEENCODE} - {c.CANTEENNAME}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="py-1.5 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 transition-colors"
            >
              <option value="ALL">All Terminal Types</option>
              <option value="STAFF_COUNTER">Staff Serving Counter</option>
              <option value="EMP_SELF_SERVICE">Employee Self-Service</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">Live (Online)</option>
              <option value="STALE">Stale (&gt;3m)</option>
              <option value="OFFLINE">Offline (&gt;10m)</option>
              <option value="ACT">Operational (Active)</option>
              <option value="DIS">Deactivated (Disabled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Device Registry Table ── */}
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
              <p className="text-sm font-grotesk font-semibold text-slate-700">Loading terminal fleet registry...</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ComputerDesktopIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-grotesk font-semibold text-slate-700">No hardware terminals found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || selectedCanteenId || selectedType !== 'ALL' || selectedStatus !== 'ALL'
                  ? 'Try clearing the search query or adjusting your filters.'
                  : 'Get started by registering the first physical hardware terminal.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-[0.72rem] font-bold uppercase tracking-wider text-slate-500 font-grotesk">
                  <tr>
                    <th className="py-3 px-4">Terminal Device</th>
                    <th className="py-3 px-4">Mode / Type</th>
                    <th className="py-3 px-4">Assigned Canteen</th>
                    <th className="py-3 px-4">Network Coordinates</th>
                    <th className="py-3 px-4">Telemetry Heartbeat</th>
                    <th className="py-3 px-4">System State</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredDevices.map((device) => {
                    const hb = getDeviceHeartbeatStatus(device.LASTHEARTBEATAT);
                    const isStaff = device.KIOSKTYPE === 'STAFF_COUNTER';
                    const isOperational = device.STATUSID === 10 || device.ISACTIVE === 1 || device.STATUSCODE === 'ACT';

                    return (
                      <tr key={device.KIOSKID} className="hover:bg-slate-50/70 transition-colors">
                        {/* Terminal Device */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                              {isStaff ? (
                                <ComputerDesktopIcon className="w-5 h-5 text-blue-800" />
                              ) : (
                                <DeviceTabletIcon className="w-5 h-5 text-cyan-700" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold font-grotesk text-slate-900">
                                {device.DEVICECODE}
                              </div>
                              <div className="text-[0.75rem] text-slate-500 line-clamp-1">
                                {device.DEVICENAME}
                              </div>
                              {device.LOCATION && (
                                <div className="text-[0.70rem] text-slate-400 mt-0.5">
                                  Loc: {device.LOCATION}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Mode / Type */}
                        <td className="py-3 px-4">
                          {isStaff ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.72rem] font-bold font-grotesk bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Serving Counter
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.72rem] font-bold font-grotesk bg-cyan-50 text-cyan-700 border border-cyan-200">
                              Self-Service
                            </span>
                          )}
                        </td>

                        {/* Assigned Canteen */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {device.CANTEENNAME || 'Unassigned'}
                          </div>
                          <div className="text-[0.72rem] text-slate-500 font-mono">
                            {device.CANTEENCODE}
                          </div>
                        </td>

                        {/* Network Coordinates */}
                        <td className="py-3 px-4 font-mono text-[0.75rem]">
                          <div className="text-slate-900 font-semibold">{device.IPADDRESS}</div>
                          {device.MACADDRESS ? (
                            <div className="text-slate-400 text-[0.70rem] mt-0.5">{device.MACADDRESS}</div>
                          ) : (
                            <div className="text-slate-300 text-[0.70rem] italic mt-0.5">No MAC logged</div>
                          )}
                        </td>

                        {/* Telemetry Heartbeat */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${hb.dot} flex-shrink-0`} />
                            <div>
                              <span
                                className={`text-[0.75rem] font-semibold font-grotesk ${
                                  hb.status === 'ONLINE'
                                    ? 'text-emerald-700'
                                    : hb.status === 'STALE'
                                    ? 'text-amber-700'
                                    : 'text-slate-500'
                                }`}
                              >
                                {hb.label}
                              </span>
                              <div className="text-[0.68rem] text-slate-400 font-mono">
                                {device.LASTHEARTBEATAT
                                  ? new Date(device.LASTHEARTBEATAT).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })
                                  : 'No ping'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* System State */}
                        <td className="py-3 px-4">
                          {isOperational ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.72rem] font-bold font-grotesk bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.72rem] font-bold font-grotesk bg-slate-100 text-slate-600 border border-slate-200">
                              <XCircleIcon className="w-3.5 h-3.5 text-slate-500" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(device)}
                              title="Edit Terminal Parameters"
                              className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(device)}
                              title={isOperational ? 'Deactivate Terminal' : 'Activate Terminal'}
                              className={`text-[0.72rem] font-semibold font-grotesk px-2.5 py-1 rounded transition-colors ${
                                isOperational
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {isOperational ? 'Deactivate' : 'Activate'}
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

      {/* ── Modal: Register / Edit Hardware Terminal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <ComputerDesktopIcon className="w-5 h-5 text-orange-400" />
                <h3 className="text-base sm:text-lg font-bold font-grotesk">
                  {editingDevice ? `Edit Terminal: ${editingDevice.DEVICECODE}` : 'Register New Hardware Terminal'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs sm:text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Device Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                    Device Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.DEVICECODE}
                    onChange={(e) => setFormData({ ...formData, DEVICECODE: e.target.value.toUpperCase() })}
                    placeholder="e.g. KSK-COUNTER-01"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                  <p className="text-[0.68rem] text-slate-400 mt-0.5">Unique hardware terminal identifier</p>
                </div>

                {/* Device Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.DEVICENAME}
                    onChange={(e) => setFormData({ ...formData, DEVICENAME: e.target.value })}
                    placeholder="e.g. Main Canteen Counter 1"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assigned Canteen */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                    Assigned Canteen *
                  </label>
                  <select
                    required
                    value={formData.CANTEENID}
                    onChange={(e) => setFormData({ ...formData, CANTEENID: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-colors"
                  >
                    <option value="">Select Canteen</option>
                    {canteens.map((c) => (
                      <option key={c.CANTEENID} value={c.CANTEENID}>
                        {c.CANTEENCODE} - {c.CANTEENNAME}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Terminal Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                    Terminal Type *
                  </label>
                  <select
                    value={formData.KIOSKTYPE}
                    onChange={(e) => setFormData({ ...formData, KIOSKTYPE: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-colors"
                  >
                    <option value="STAFF_COUNTER">STAFF_COUNTER (Serving Counter)</option>
                    <option value="EMP_SELF_SERVICE">EMP_SELF_SERVICE (Self-Service Kiosk)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Static IP Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                    Static IP Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.IPADDRESS}
                    onChange={(e) => setFormData({ ...formData, IPADDRESS: e.target.value })}
                    placeholder="e.g. 192.168.1.50"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                  <p className="text-[0.68rem] text-slate-400 mt-0.5">Used for hardware identity resolution</p>
                </div>

                {/* MAC Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    value={formData.MACADDRESS}
                    onChange={(e) => setFormData({ ...formData, MACADDRESS: e.target.value })}
                    placeholder="e.g. B8:27:EB:01:23:45"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                  />
                  <p className="text-[0.68rem] text-slate-400 mt-0.5">Physical network interface address</p>
                </div>
              </div>

              {/* Physical Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-grotesk mb-1">
                  Physical Location Notes
                </label>
                <input
                  type="text"
                  value={formData.LOCATION}
                  onChange={(e) => setFormData({ ...formData, LOCATION: e.target.value })}
                  placeholder="e.g. Dining Hall A, Serving Window #2"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <GhostBtn onClick={() => setShowModal(false)} disabled={formSubmitting}>
                  Cancel
                </GhostBtn>
                <PrimaryBtn type="submit" loading={formSubmitting} className="!w-auto">
                  {editingDevice ? 'Save Configuration' : 'Register Terminal'}
                </PrimaryBtn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
