import { useState } from 'react';
import { useMenu } from '../hooks/useMenu';
import { MenuTable } from '../components/MenuTable';
import { MenuForm } from '../components/MenuForm';

export default function MenuCatalogPage() {
  const { menus, loading, error, addMenu, editMenu } = useMenu();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

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

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Space Blue Header */}
      <div className="px-8 py-6 shadow-sm border-b" style={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-grotesk text-white">Menu Catalog</h1>
            <p className="text-[0.75rem] mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Manage your global food and beverage offerings.
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
      <div className="flex-1 p-8 overflow-y-auto">
        {globalError && !isModalOpen && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm">
            {globalError}
          </div>
        )}
        
        <MenuTable 
          menus={menus} 
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
