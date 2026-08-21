import { useState, useEffect } from 'react';

export function MenuForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState({
    MENUCODE: '',
    SHORTNAME: '',
    ITEMNAME: '',
    ITEMDESCR: '',
    ISSPECIAL: 0,
    STATUS: 'A',
    CHGREASON: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        MENUCODE: initialData.MENUCODE || '',
        SHORTNAME: initialData.SHORTNAME || '',
        ITEMNAME: initialData.ITEMNAME || '',
        ITEMDESCR: initialData.ITEMDESCR || '',
        ISSPECIAL: initialData.ISSPECIAL || 0,
        STATUS: initialData.STATUS || 'A',
        CHGREASON: '' // reset change reason
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
    // Clear error for field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!isEdit && !formData.MENUCODE.trim()) newErrors.MENUCODE = 'Menu Code is required';
    if (!formData.SHORTNAME.trim()) newErrors.SHORTNAME = 'Short Name is required';
    if (!formData.ITEMNAME.trim()) newErrors.ITEMNAME = 'Item Name is required';
    if (isEdit && !formData.CHGREASON?.trim()) newErrors.CHGREASON = 'Change reason is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Clean up payload
    const payload = { ...formData };
    if (!payload.ITEMDESCR) payload.ITEMDESCR = null;
    
    // MENUCODE shouldn't be sent on PUT per schema, but API might ignore it. Better to explicitly omit if edit.
    if (isEdit) {
      delete payload.MENUCODE;
    } else {
      delete payload.STATUS;
      delete payload.CHGREASON;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ backgroundColor: '#0F172A' }}>
          <h2 className="text-lg font-bold font-grotesk text-white">
            {isEdit ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button 
            onClick={onCancel}
            className="text-white/60 hover:text-white transition-colors focus:outline-none"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.75rem] font-semibold text-slate-700 mb-1">
                  Menu Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="MENUCODE"
                  value={formData.MENUCODE}
                  onChange={handleChange}
                  disabled={isEdit}
                  maxLength={20}
                  className={`w-full px-3 py-2 text-sm border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                    errors.MENUCODE ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                  } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="e.g. LUN01"
                />
                {errors.MENUCODE && <p className="text-red-500 text-[0.65rem] mt-1">{errors.MENUCODE}</p>}
              </div>

              <div>
                <label className="block text-[0.75rem] font-semibold text-slate-700 mb-1">
                  Short Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="SHORTNAME"
                  value={formData.SHORTNAME}
                  onChange={handleChange}
                  maxLength={30}
                  className={`w-full px-3 py-2 text-sm border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                    errors.SHORTNAME ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                  }`}
                  placeholder="e.g. Veg Thali"
                />
                {errors.SHORTNAME && <p className="text-red-500 text-[0.65rem] mt-1">{errors.SHORTNAME}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[0.75rem] font-semibold text-slate-700 mb-1">
                Full Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ITEMNAME"
                value={formData.ITEMNAME}
                onChange={handleChange}
                maxLength={100}
                className={`w-full px-3 py-2 text-sm border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                  errors.ITEMNAME ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                }`}
                placeholder="e.g. Standard Vegetarian Thali"
              />
              {errors.ITEMNAME && <p className="text-red-500 text-[0.65rem] mt-1">{errors.ITEMNAME}</p>}
            </div>

            <div>
              <label className="block text-[0.75rem] font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="ITEMDESCR"
                value={formData.ITEMDESCR}
                onChange={handleChange}
                maxLength={255}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
                placeholder="Optional description..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ISSPECIAL"
                name="ISSPECIAL"
                checked={formData.ISSPECIAL === 1}
                onChange={handleChange}
                className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="ISSPECIAL" className="text-sm font-medium text-slate-700 cursor-pointer">
                Mark as Special Item
              </label>
            </div>

            {isEdit && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-[0.75rem] font-semibold text-slate-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="STATUS"
                    value={formData.STATUS}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  >
                    <option value="A">Active</option>
                    <option value="D">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.75rem] font-semibold text-slate-700 mb-1">
                    Reason for Change <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="CHGREASON"
                    value={formData.CHGREASON}
                    onChange={handleChange}
                    maxLength={255}
                    className={`w-full px-3 py-2 text-sm border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
                      errors.CHGREASON ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                    }`}
                    placeholder="e.g. Price update"
                  />
                  {errors.CHGREASON && <p className="text-red-500 text-[0.65rem] mt-1">{errors.CHGREASON}</p>}
                </div>
              </div>
            )}
            
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-slate-900 bg-orange-500 rounded hover:bg-orange-400 transition-colors shadow-sm focus:outline-none disabled:opacity-70 flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
