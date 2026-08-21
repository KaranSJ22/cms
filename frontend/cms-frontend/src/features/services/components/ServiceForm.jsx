import React, { useState, useEffect } from "react";

export default function ServiceForm({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    SERVCODE: "",
    SERVNAME: "",
    DEFSTART: "",
    DEFEND: "",
    STATUS: "A",
    CHGREASON: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        SERVCODE: initialData.SERVCODE || "",
        SERVNAME: initialData.SERVNAME || "",
        DEFSTART: initialData.DEFSTART ? initialData.DEFSTART.substring(0, 5) : "",
        DEFEND: initialData.DEFEND ? initialData.DEFEND.substring(0, 5) : "",
        STATUS: initialData.STATUS || "A",
        CHGREASON: "",
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    if (!isEditMode && !formData.SERVCODE.trim())
      newErrors.SERVCODE = "Service code is required";
    if (!formData.SERVNAME.trim())
      newErrors.SERVNAME = "Service name is required";
    if (!formData.DEFSTART)
      newErrors.DEFSTART = "Default start time is required";
    if (!formData.DEFEND) newErrors.DEFEND = "Default end time is required";

    if (formData.DEFSTART && formData.DEFEND && formData.DEFEND <= formData.DEFSTART) {
      newErrors.DEFEND = "End time must be after start time";
    }

    if (isEditMode && formData.STATUS !== "A" && !formData.CHGREASON.trim()) {
      newErrors.CHGREASON = "Reason is required when deactivating";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit = { ...formData };
      if (!isEditMode) {
        delete dataToSubmit.STATUS;
        delete dataToSubmit.CHGREASON;
      }
      onSubmit(dataToSubmit);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEditMode ? "Edit Service" : "Add New Service"}
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Service Code */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Service Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="SERVCODE"
              value={formData.SERVCODE}
              onChange={handleChange}
              disabled={isEditMode}
              placeholder="e.g., BRKFST"
              className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                errors.SERVCODE
                  ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-500"
              }`}
            />
            {errors.SERVCODE && (
              <p className="mt-1 text-xs text-rose-500">{errors.SERVCODE}</p>
            )}
          </div>

          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="SERVNAME"
              value={formData.SERVNAME}
              onChange={handleChange}
              placeholder="e.g., Breakfast"
              className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                errors.SERVNAME
                  ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              }`}
            />
            {errors.SERVNAME && (
              <p className="mt-1 text-xs text-rose-500">{errors.SERVNAME}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Default Start */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Default Start <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                name="DEFSTART"
                value={formData.DEFSTART}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                  errors.DEFSTART
                    ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                }`}
              />
              {errors.DEFSTART && (
                <p className="mt-1 text-xs text-rose-500">{errors.DEFSTART}</p>
              )}
            </div>

            {/* Default End */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Default End <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                name="DEFEND"
                value={formData.DEFEND}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                  errors.DEFEND
                    ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                }`}
              />
              {errors.DEFEND && (
                <p className="mt-1 text-xs text-rose-500">{errors.DEFEND}</p>
              )}
            </div>
          </div>

          {/* Status & Change Reason (Edit Mode Only) */}
          {isEditMode && (
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="STATUS"
                  value={formData.STATUS}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="A">Active</option>
                  <option value="D">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Change Reason{" "}
                  {formData.STATUS !== "A" && (
                    <span className="text-rose-500">*</span>
                  )}
                </label>
                <input
                  type="text"
                  name="CHGREASON"
                  value={formData.CHGREASON}
                  onChange={handleChange}
                  placeholder="Reason for modification"
                  className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                    errors.CHGREASON
                      ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  }`}
                />
                {errors.CHGREASON && (
                  <p className="mt-1 text-xs text-rose-500">{errors.CHGREASON}</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Add Service"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
