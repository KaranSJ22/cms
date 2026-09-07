import { useState, useEffect } from 'react';
import { useMenu } from '../hooks/useMenu';
import { MenuTable } from '../components/MenuTable';
import { MenuForm } from '../components/MenuForm';
import { getServices } from '../../services/api/servicesApi';

export default function MenuCatalogPage() {
  const { menus, loading, error, addMenu, editMenu } = useMenu();
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  useEffect(() => {
    getServices()
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setGlobalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setGlobalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setGlobalError('');
    
    let result;
    if (editingItem) {
      result = await editMenu(editingItem.MENUITEMID, formData);
    } else {
      result = await addMenu(formData);
    }

    setIsSubmitting(false);

    if (result.success) {
      handleCloseModal();
    } else {
      setGlobalError(result.error);
    }
  };

  const filteredMenus = (menus || []).filter((m) => {
    if (serviceFilter === 'ALL') return true;
    if (serviceFilter === 'GENERIC') return !m.SERVICEID;
    return String(m.SERVICEID) === serviceFilter;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Space Blue Header */}
      <div className="px-8 py-6 shadow-sm border-b" style={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-grotesk text-white">Menu Catalog</h1>
            <p className="text-[0.75rem] mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Manage your global food and beverage offerings and service associations.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2 text-sm font-semibold text-slate-900 bg-orange-500 rounded hover:bg-orange-400 transition-all shadow-sm focus:outline-none flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto space-y-4">
        {/* Toolbar Filter */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter by Category:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ALL">All Categories / Services</option>
              <option value="GENERIC">All Services / Generic Only</option>
              {services.map((s) => (
                <option key={s.SERVICEID} value={String(s.SERVICEID)}>
                  {s.SERVNAME} ({s.SERVCODE})
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Showing <strong>{filteredMenus.length}</strong> items
          </span>
        </div>

        {globalError && !isModalOpen && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm">
            {globalError}
          </div>
        )}
        
        <MenuTable 
          menus={filteredMenus} 
          loading={loading} 
          error={error} 
          onEdit={handleOpenEdit} 
        />
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <MenuForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSubmitting={isSubmitting}
        />
      )}
      
      {/* Optional: Error inside modal if submitting fails */}
      {isModalOpen && globalError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <span className="block sm:inline">{globalError}</span>
        </div>
      )}
    </div>
  );
}
