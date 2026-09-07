import { useState, useEffect } from "react";
import * as servicesApi from "../../services/api/servicesApi";
import { getActiveCanteens } from "../api/daySlotsApi";
import { useAuth } from "../../../hooks/useAuth";

export default function DaySlotForm({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const isEditMode = !!initialData;
  const { user } = useAuth();
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  const [formData, setFormData] = useState(() => ({
    CANTEENID: initialData?.CANTEENID || "",
    SERVICEID: initialData?.SERVICEID || "",
    SERVDATE: initialData?.SERVDATE ? initialData.SERVDATE.substring(0, 10) : "",
    STARTTIME: initialData?.STARTTIME ? initialData.STARTTIME.substring(0, 5) : "",
    ENDTIME: initialData?.ENDTIME ? initialData.ENDTIME.substring(0, 5) : "",
    STATUS: initialData?.STATUSCODE || initialData?.STATUS || "ACT",
    CHGREASON: "",
  }));

  const [errors, setErrors] = useState({});
  const [canteens, setCanteens] = useState([]);
  const [services, setServices] = useState([]);

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setFormData({
      CANTEENID: initialData?.CANTEENID || "",
      SERVICEID: initialData?.SERVICEID || "",
      SERVDATE: initialData?.SERVDATE ? initialData.SERVDATE.substring(0, 10) : "",
      STARTTIME: initialData?.STARTTIME ? initialData.STARTTIME.substring(0, 5) : "",
      ENDTIME: initialData?.ENDTIME ? initialData.ENDTIME.substring(0, 5) : "",
      STATUS: initialData?.STATUSCODE || initialData?.STATUS || "ACT",
      CHGREASON: "",
    });
  }

  useEffect(() => {
    // Load canteens and services for dropdowns
    async function loadDropdowns() {
      try {
        const [canteenData, serviceData] = await Promise.all([
          getActiveCanteens(),
          servicesApi.getServices(),
        ]);
        
        // Filter canteens to only those the user has a role in
        const userCanteenIds = (user?.CANTEENROLES || []).map(r => r.CANTEENID);
        const hasAdminRole = (user?.SYSTEMROLES || []).includes('ADMIN');
        
        let filteredCanteens = canteenData || [];
        if (!hasAdminRole) {
          filteredCanteens = filteredCanteens.filter(c => userCanteenIds.includes(c.CANTEENID));
        }
        
        setCanteens(filteredCanteens);
        
        // Filter only active services
        const activeServices = (serviceData || []).filter(s => s.STATUSCODE === 'ACT');
        setServices(activeServices);
      } catch (err) {
        console.error("Failed to load dropdowns", err);
      }
    }
    loadDropdowns();
  }, [user]);

  // When a service is selected, default its start and end times if empty
  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const selectedService = services.find((s) => s.SERVICEID.toString() === serviceId);
    
    setFormData((prev) => ({
      ...prev,
      SERVICEID: serviceId,
      STARTTIME: prev.STARTTIME || (selectedService ? selectedService.DEFSTART.substring(0, 5) : ""),
      ENDTIME: prev.ENDTIME || (selectedService ? selectedService.DEFEND.substring(0, 5) : ""),
    }));

    if (errors.SERVICEID) {
      setErrors((prev) => ({ ...prev, SERVICEID: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.CANTEENID) newErrors.CANTEENID = "Canteen is required";
    if (!formData.SERVICEID) newErrors.SERVICEID = "Service is required";
    if (!formData.SERVDATE) newErrors.SERVDATE = "Date is required";
    if (!formData.STARTTIME) newErrors.STARTTIME = "Start time is required";
    if (!formData.ENDTIME) newErrors.ENDTIME = "End time is required";

    if (formData.STARTTIME && formData.ENDTIME && formData.ENDTIME <= formData.STARTTIME) {
      newErrors.ENDTIME = "End time must be after start time";
    }

    if (isEditMode && formData.STATUS !== "ACT" && !formData.CHGREASON.trim()) {
      newErrors.CHGREASON = "Reason is required when deactivating";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (isEditMode) {
        onSubmit({
          STARTTIME: formData.STARTTIME,
          ENDTIME: formData.ENDTIME,
          STATUS: formData.STATUS,
          CHGREASON: formData.CHGREASON,
        });
      } else {
        onSubmit({
          CANTEENID: Number(formData.CANTEENID),
          SERVICEID: Number(formData.SERVICEID),
          SERVDATE: formData.SERVDATE,
          STARTTIME: formData.STARTTIME,
          ENDTIME: formData.ENDTIME,
        });
      }
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
            {isEditMode ? "Edit Day Slot" : "Add New Day Slot"}
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
          {/* Canteen */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Canteen <span className="text-rose-500">*</span>
            </label>
            <select
              name="CANTEENID"
              value={formData.CANTEENID}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                errors.CANTEENID
                  ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-500"
              }`}
            >
              <option value="">Select a Canteen</option>
              {canteens.map((c) => (
                <option key={c.CANTEENID} value={c.CANTEENID}>
                  {c.CANTEENNAME}
                </option>
              ))}
            </select>
            {errors.CANTEENID && (
              <p className="mt-1 text-xs text-rose-500">{errors.CANTEENID}</p>
            )}
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Service <span className="text-rose-500">*</span>
            </label>
            <select
              name="SERVICEID"
              value={formData.SERVICEID}
              onChange={handleServiceChange}
              disabled={isEditMode}
              className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                errors.SERVICEID
                  ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-500"
              }`}
            >
              <option value="">Select a Service</option>
              {services.map((s) => (
                <option key={s.SERVICEID} value={s.SERVICEID}>
                  {s.SERVNAME} ({s.SERVCODE})
                </option>
              ))}
            </select>
            {errors.SERVICEID && (
              <p className="mt-1 text-xs text-rose-500">{errors.SERVICEID}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="SERVDATE"
              value={formData.SERVDATE}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                errors.SERVDATE
                  ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-500"
              }`}
            />
            {errors.SERVDATE && (
              <p className="mt-1 text-xs text-rose-500">{errors.SERVDATE}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                name="STARTTIME"
                value={formData.STARTTIME}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                  errors.STARTTIME
                    ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                }`}
              />
              {errors.STARTTIME && (
                <p className="mt-1 text-xs text-rose-500">{errors.STARTTIME}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                name="ENDTIME"
                value={formData.ENDTIME}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all ${
                  errors.ENDTIME
                    ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                }`}
              />
              {errors.ENDTIME && (
                <p className="mt-1 text-xs text-rose-500">{errors.ENDTIME}</p>
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
                  <option value="ACT">Active</option>
                  <option value="DIS">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Change Reason{" "}
                  {formData.STATUS !== "ACT" && (
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
                "Add Day Slot"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
