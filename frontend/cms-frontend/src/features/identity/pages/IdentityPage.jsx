import { useState } from 'react';
import {
  ShieldCheckIcon,
  KeyIcon,
  CheckBadgeIcon,
  XCircleIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useIdentity, useFetchData } from '../hooks/useIdentity';
import { identityService } from '../api/identityService';

import { RolesTable } from '../components/RolesTable';
import { RoleForm } from '../components/RoleForm';

import { PrimaryBtn } from '../../../components/ui/Buttons';

export default function IdentityPage() {
  const [showModal, setShowModal] = useState(false);

  const { executeRequest, loading: mutationLoading } = useIdentity();

  // Fetch only role data for governance
  const { data: roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useFetchData(identityService.getRoles);

  const handleRefreshAll = () => {
    if (refetchRoles) refetchRoles();
  };

  const handleAssignRole = async (data) => {
    const { success } = await executeRequest(identityService.assignUserRole, data);
    if (success) {
      setShowModal(false);
      refetchRoles();
    }
  };

  const activeRolesCount = roles?.filter((r) => r.ISACTIVE === 1)?.length ?? 0;
  const inactiveRolesCount = roles?.filter((r) => r.ISACTIVE !== 1)?.length ?? 0;

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* ── Top Header Canvas (Stripe Style) ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheckIcon className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl sm:text-2xl font-bold font-grotesk text-slate-900 tracking-tight">
              Role & Access Governance
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            System administration &amp; privilege tiers. Assign operational and system privileges to enterprise users.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAll}
            disabled={rolesLoading}
            title="Refresh Roles"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold font-grotesk bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-300 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <ArrowPathIcon className={`w-4 h-4 text-slate-500 ${rolesLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <PrimaryBtn onClick={() => setShowModal(true)} className="!w-auto">
            <PlusIcon className="w-4 h-4" />
            <span>Assign Role</span>
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">Configured Roles</span>
              <KeyIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900">
              {roles?.length ?? 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">System admin &amp; operational privilege tiers</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">Active Roles</span>
              <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-emerald-700">
              {activeRolesCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Available for user assignments</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-grotesk">Inactive Roles</span>
              <XCircleIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-700">
              {inactiveRolesCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Deprecated or dormant privilege sets</div>
          </div>
        </div>
      </div>

      {/* ── Main Roles Table Content Area ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-grotesk text-slate-900 uppercase tracking-wide">
                Configured System Roles ({roles?.length ?? 0})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of security roles, permissions, and operational status.
              </p>
            </div>
          </div>
          <RolesTable roles={roles} loading={rolesLoading} error={rolesError} />
        </div>
      </div>

      {/* Slide-over Form Panel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => !mutationLoading && setShowModal(false)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-slate-50 shadow-2xl h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold font-grotesk text-white">
                  Assign System Role to User
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  disabled={mutationLoading}
                  className="text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <RoleForm 
                  onSubmit={handleAssignRole} 
                  loading={mutationLoading} 
                  onCancel={() => setShowModal(false)} 
                  roles={roles}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
