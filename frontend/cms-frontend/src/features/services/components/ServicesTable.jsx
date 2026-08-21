import React from "react";

export default function ServicesTable({ services, onEdit }) {
  if (!services || services.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
        No services found. Click "Add Service" to create one.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <th className="py-4 px-6 font-semibold">Code</th>
              <th className="py-4 px-6 font-semibold">Service Name</th>
              <th className="py-4 px-6 font-semibold">Default Start</th>
              <th className="py-4 px-6 font-semibold">Default End</th>
              <th className="py-4 px-6 font-semibold text-center">Status</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {services.map((service) => (
              <tr
                key={service.SERVICEID}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-slate-900">
                  {service.SERVCODE}
                </td>
                <td className="py-4 px-6">{service.SERVNAME}</td>
                <td className="py-4 px-6 text-slate-500">
                  {service.DEFSTART?.substring(0, 5)}
                </td>
                <td className="py-4 px-6 text-slate-500">
                  {service.DEFEND?.substring(0, 5)}
                </td>
                <td className="py-4 px-6 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.STATUS === "A"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {service.STATUS === "A" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => onEdit(service)}
                    className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Service"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
