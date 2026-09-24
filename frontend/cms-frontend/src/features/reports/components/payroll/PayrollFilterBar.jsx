import {
  CalendarDaysIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function PayrollFilterBar({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedType,
  setSelectedType,
  selectedCanteen,
  setSelectedCanteen,
  loginIdQuery,
  setLoginIdQuery,
  canteens = [],
  MONTHS = [],
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 print:hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Month Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Billing Month
          </label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium appearance-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <CalendarDaysIcon className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Billing Year
          </label>
          <input
            type="number"
            min="2020"
            max="2035"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Employee Category
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium cursor-pointer"
          >
            <option value="ALL">All Eligible (Permanent + Other Centre)</option>
            <option value="PRM">Permanent Employees Only</option>
            <option value="OCE">Other Centre Employees Only</option>
          </select>
        </div>

        {/* Canteen Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Canteen Facility
          </label>
          <div className="relative">
            <select
              value={selectedCanteen}
              onChange={(e) => setSelectedCanteen(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium appearance-none cursor-pointer"
            >
              <option value="">All Canteens</option>
              {canteens.map((c) => (
                <option key={c.CANTEENID} value={c.CANTEENID}>
                  {c.CANTEENNAME} ({c.CANTEENCODE})
                </option>
              ))}
            </select>
            <BuildingOffice2Icon className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Search by Login ID */}
        <div>
          <label className="block text-xs font-bold text-orange-600 mb-1 flex items-center justify-between">
            <span>Search by Login ID</span>
            {loginIdQuery && (
              <button
                type="button"
                onClick={() => setLoginIdQuery("")}
                className="text-slate-400 hover:text-slate-600 font-normal cursor-pointer"
              >
                Clear
              </button>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. perm1, oce1, isro_user"
              value={loginIdQuery}
              onChange={(e) => setLoginIdQuery(e.target.value)}
              className="w-full bg-orange-50/50 border border-orange-200 text-slate-900 text-xs font-mono rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-orange-500 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
