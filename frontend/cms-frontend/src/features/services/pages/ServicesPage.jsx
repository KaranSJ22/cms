import React, { useState } from "react";
import { useServices } from "../hooks/useServices";
import ServicesTable from "../components/ServicesTable";
import ServiceForm from "../components/ServiceForm";

export default function ServicesPage() {
  const { services, loading, error, addService, editService } = useServices();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAddForm = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    let success = false;
    if (editingService) {
      success = await editService(editingService.SERVICEID, formData);
    } else {
      success = await addService(formData);
    }
    setIsSubmitting(false);

    if (success) {
      handleCloseForm();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header aligned with ISRO Space Blue / Saffron design */}
      <div className="bg-[#0F172A] rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        {/* Abstract background accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Global Services
            </h1>
            <p className="mt-2 text-blue-100/80 max-w-xl">
              Manage reusable canteen services (e.g., Breakfast, Lunch) and their default timing windows.
            </p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="shrink-0 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add Service
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {error && (
          <div className="mb-6 p-4 bg-rose-50/80 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-rose-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium">
                Loading services...
              </p>
            </div>
          </div>
        ) : (
          <ServicesTable services={services} onEdit={handleOpenEditForm} />
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <ServiceForm
          initialData={editingService}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
