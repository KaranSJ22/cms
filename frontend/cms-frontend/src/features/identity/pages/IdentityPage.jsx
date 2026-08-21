import { useState } from 'react';
import { useIdentity, useFetchData } from '../hooks/useIdentity';
import { identityService } from '../api/identityService';

import { UsersTable } from '../components/UsersTable';
import { UserForm } from '../components/UserForm';
import { CustomersTable } from '../components/CustomersTable';
import { CustomerForm } from '../components/CustomerForm';
import { RolesTable } from '../components/RolesTable';
import { RoleForm } from '../components/RoleForm';

import { PrimaryBtn } from '../../../components/ui/Buttons';

export default function IdentityPage() {
  const [activeTab, setActiveTab] = useState('USERS');
  const [showModal, setShowModal] = useState(false);

  const { executeRequest, loading: mutationLoading } = useIdentity();

  // Fetch data
  const { data: users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useFetchData(identityService.getUsers);
  const { data: customers, loading: customersLoading, error: customersError, refetch: refetchCustomers } = useFetchData(identityService.getCustomers);
  const { data: roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles } = useFetchData(identityService.getRoles);

  const handleCreateUser = async (data) => {
    const { success } = await executeRequest(identityService.createUser, data);
    if (success) {
      setShowModal(false);
      refetchUsers();
    }
  };

  const handleCreateCustomer = async (data) => {
    const { success } = await executeRequest(identityService.createCustomer, data);
    if (success) {
      setShowModal(false);
      refetchCustomers();
    }
  };

  const handleAssignRole = async (data) => {
    const { success } = await executeRequest(identityService.assignUserRole, data);
    if (success) {
      setShowModal(false);
      refetchRoles();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'USERS':
        return <UsersTable users={users} loading={usersLoading} error={usersError} />;
      case 'CUSTOMERS':
        return <CustomersTable customers={customers} loading={customersLoading} error={customersError} />;
      case 'ROLES':
        return <RolesTable roles={roles} loading={rolesLoading} error={rolesError} />;
      default:
        return null;
    }
  };

  const renderFormContent = () => {
    switch (activeTab) {
      case 'USERS':
        return <UserForm onSubmit={handleCreateUser} loading={mutationLoading} onCancel={() => setShowModal(false)} />;
      case 'CUSTOMERS':
        return <CustomerForm onSubmit={handleCreateCustomer} loading={mutationLoading} onCancel={() => setShowModal(false)} />;
      case 'ROLES':
        return <RoleForm onSubmit={handleAssignRole} loading={mutationLoading} onCancel={() => setShowModal(false)} />;
      default:
        return null;
    }
  };

  const getFormTitle = () => {
    switch (activeTab) {
      case 'USERS': return 'Create New User';
      case 'CUSTOMERS': return 'Create New Customer';
      case 'ROLES': return 'Assign Role to User';
      default: return 'Add New';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-blue-900 border-b border-blue-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-grotesk text-white">Identity Management</h1>
          <p className="text-blue-200 text-sm mt-1 font-inter">Manage users, customers, and role assignments.</p>
        </div>
        <div className="flex items-center gap-4">
          <PrimaryBtn onClick={() => setShowModal(true)}>
            + Add {activeTab === 'USERS' ? 'User' : activeTab === 'CUSTOMERS' ? 'Customer' : 'Role'}
          </PrimaryBtn>
        </div>
      </div>

      {/* 2. Filters / Tabs */}
      <div className="px-8 border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`py-4 font-bold text-[0.85rem] tracking-wide font-grotesk uppercase transition-colors relative
              ${activeTab === 'USERS' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-900'}
            `}
          >
            Users
            {activeTab === 'USERS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`py-4 font-bold text-[0.85rem] tracking-wide font-grotesk uppercase transition-colors relative
              ${activeTab === 'CUSTOMERS' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-900'}
            `}
          >
            Customers
            {activeTab === 'CUSTOMERS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('ROLES')}
            className={`py-4 font-bold text-[0.85rem] tracking-wide font-grotesk uppercase transition-colors relative
              ${activeTab === 'ROLES' ? 'text-orange-500' : 'text-slate-500 hover:text-slate-900'}
            `}
          >
            Roles
            {activeTab === 'ROLES' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />}
          </button>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          {renderTabContent()}
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
          <div className="relative w-full max-w-md bg-slate-50 shadow-2xl h-full flex flex-col animate-slide-in-right">
            <div className="px-6 py-5 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-grotesk text-slate-900">
                  {getFormTitle()}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  disabled={mutationLoading}
                  className="text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                {renderFormContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
