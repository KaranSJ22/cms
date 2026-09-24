import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function BookingsFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  setCurrentPage,
}) {
  const statusOptions = [
    { key: "ALL", label: "All Bookings" },
    { key: "CRT", label: "Active" },
    { key: "SRV", label: "Served" },
    { key: "CAN", label: "Cancelled" },
  ];

  return (
    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60">
      <div className="relative w-full sm:w-72">
        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search booking no, service, date..."
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
        {statusOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setStatusFilter(key);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === key
                ? "bg-[#0F172A] text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
