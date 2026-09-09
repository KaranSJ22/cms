import { useState, useEffect, useCallback, useMemo } from "react";
import { reportApi } from "../api/reportApi";
import { getActiveCanteens } from "../../dayslot/api/daySlotsApi";
import { formatINR } from "../../../utils/formatters";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  UsersIcon,
  BanknotesIcon,
  XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function MonthlyPayrollReportPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedCanteen, setSelectedCanteen] = useState("");
  const [selectedType, setSelectedType] = useState("ALL"); // 'ALL' | 'PRM' | 'OCE'
  const [loginIdQuery, setLoginIdQuery] = useState("");

  const [canteens, setCanteens] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Breakdown modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);
  const [breakdownError, setBreakdownError] = useState(null);

  // Load initial canteens
  useEffect(() => {
    getActiveCanteens()
      .then((data) => setCanteens(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load canteens", err));
  }, []);

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear,
      };
      if (selectedCanteen) params.canteenId = selectedCanteen;
      if (selectedType !== "ALL") params.customerType = selectedType;
      if (loginIdQuery.trim()) params.loginId = loginIdQuery.trim();

      const res = await reportApi.getMonthlyPayroll(params);
      const data = res.data?.DATA || res.data || {};
      setReportData(data);
    } catch (err) {
      console.error("Failed to fetch payroll report", err);
      setError(err.response?.data?.MESSAGE || "Failed to load monthly payroll report.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedCanteen, selectedType, loginIdQuery]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Open itemized breakdown
  const handleOpenDetail = async (emp) => {
    setSelectedCustomer(emp);
    setDetailModalOpen(true);
    setBreakdownLoading(true);
    setBreakdownError(null);
    try {
      const res = await reportApi.getEmployeePayrollBreakdown(emp.CUSTOMERID, {
        month: selectedMonth,
        year: selectedYear,
      });
      setBreakdownData(res.data?.DATA || res.data || null);
    } catch (err) {
      console.error("Failed to fetch employee breakdown", err);
      setBreakdownError(err.response?.data?.MESSAGE || "Failed to load itemized bookings.");
      setBreakdownData(null);
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Close modal
  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedCustomer(null);
    setBreakdownData(null);
    setBreakdownError(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData?.employees || reportData.employees.length === 0) {
      alert("No data available to export.");
      return;
    }

    const monthName = MONTHS.find((m) => m.value === Number(selectedMonth))?.label || selectedMonth;
    const filename = `Monthly_Payroll_${monthName}_${selectedYear}.csv`;

    const headers = [
      "Login ID",
      "Employee Code",
      "Full Name",
      "Customer Category",
      "Department",
      "Designation",
      "Centre Name",
      "Days Booked",
      "Total Bookings",
      "Served Bookings",
      "No-Show Bookings",
      "Canteens Used",
      "Monthly Bill Amount (INR)",
    ];

    const csvRows = [headers.join(",")];

    reportData.employees.forEach((emp) => {
      const row = [
        `"${emp.LOGINID || ""}"`,
        `"${emp.EMPCODE || ""}"`,
        `"${emp.FULLNAME || ""}"`,
        `"${emp.CTYPENAME || emp.CTYPECODE || ""}"`,
        `"${emp.DEPT || ""}"`,
        `"${emp.DESIG || ""}"`,
        `"${emp.CENTERNAME || "HQ"}"`,
        emp.DAYS_BOOKED || 0,
        emp.TOTAL_BOOKINGS || 0,
        emp.SERVED_BOOKINGS || 0,
        emp.NOSHOW_BOOKINGS || 0,
        `"${emp.CANTEENS_USED || ""}"`,
        Number(emp.TOTAL_AMOUNT || 0).toFixed(2),
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const employees = reportData?.employees || [];
  const summary = reportData?.summary || {
    totalEmployees: 0,
    totalDaysBooked: 0,
    totalBookings: 0,
    totalServed: 0,
    totalNoShow: 0,
    totalAmount: 0,
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-inter print:p-0">
      {/* ── Space Blue ISRO Header ── */}
      <div className="bg-[#0F172A] rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden print:bg-white print:text-black print:border-b">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-400 font-mono text-xs tracking-wider uppercase">
              <span>Accounts & Billing Module</span>
              <span>•</span>
              <span>Salary Recovery</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-grotesk tracking-tight mt-1 text-white print:text-slate-900">
              Monthly Payroll Deduction Report
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 print:text-slate-600">
              Monthly meal bookings, canteen usage, and deduction amounts for Permanent & Other Centre Employees.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              onClick={handleExportCSV}
              disabled={employees.length === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center gap-2"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={fetchReport}
              disabled={loading}
              className="p-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center disabled:opacity-50"
              title="Refresh Report"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Controls Card ── */}
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium appearance-none"
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
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium appearance-none"
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
                  className="text-slate-400 hover:text-slate-600 font-normal"
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

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed Staff */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Employees
            </p>
            <p className="text-2xl font-black font-grotesk text-slate-800">
              {summary.totalEmployees}
            </p>
          </div>
        </div>

        {/* Days Booked (Cumulative) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CalendarDaysIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cumulative Days
            </p>
            <p className="text-2xl font-black font-grotesk text-slate-800">
              {summary.totalDaysBooked}
            </p>
          </div>
        </div>

        {/* Meals Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Meals (Served / Total)
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-grotesk text-slate-800">
                {summary.totalServed}
              </span>
              <span className="text-xs font-medium text-slate-400">
                / {summary.totalBookings}
              </span>
              {summary.totalNoShow > 0 && (
                <span className="text-xs font-semibold text-amber-600 ml-1">
                  ({summary.totalNoShow} No-Show)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Monthly Amount */}
        <div className="bg-white rounded-2xl p-5 border border-orange-200 bg-gradient-to-br from-white to-orange-50/40 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25">
            <BanknotesIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Total Deduction
            </p>
            <p className="text-2xl font-black font-grotesk text-slate-900">
              {formatINR(summary.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Data Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            <p className="text-xs font-medium">Computing monthly payroll report...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 space-y-2">
            <XCircleIcon className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <UsersIcon className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No Billing Records Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No meal bookings were found for Permanent or Other Centre Employees matching the selected period and filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Login ID</th>
                  <th className="py-3.5 px-4">Employee Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Days Booked</th>
                  <th className="py-3.5 px-4 text-center">Meals Breakdown</th>
                  <th className="py-3.5 px-4">Canteens Used</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center print:hidden">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {employees.map((emp) => {
                  const isPermanent =
                    emp.CTYPECODE === "PRM" || emp.CTYPECODE === "PERMEMP";
                  return (
                    <tr
                      key={emp.CUSTOMERID}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Login ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                          {emp.LOGINID}
                        </span>
                      </td>

                      {/* Employee Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {emp.FULLNAME}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {emp.EMPCODE && `Code: ${emp.EMPCODE}`}
                          {emp.DEPT && ` • ${emp.DEPT}`}
                          {emp.DESIG && ` (${emp.DESIG})`}
                        </div>
                        {emp.CENTERNAME && (
                          <div className="text-[10px] text-purple-600 font-semibold">
                            Centre: {emp.CENTERNAME}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            isPermanent
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {isPermanent ? "Permanent Staff" : "Other Centre"}
                        </span>
                      </td>

                      {/* Days Booked */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block font-bold text-slate-800 text-sm">
                          {emp.DAYS_BOOKED}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          days
                        </span>
                      </td>

                      {/* Meals Breakdown */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title="Served"
                          >
                            {emp.SERVED_BOOKINGS} Srv
                          </span>
                          {emp.NOSHOW_BOOKINGS > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                              title="No-Show"
                            >
                              {emp.NOSHOW_BOOKINGS} No-Show
                            </span>
                          )}
                          <span className="text-slate-400 text-[11px] font-normal">
                            ({emp.TOTAL_BOOKINGS} tot)
                          </span>
                        </div>
                      </td>

                      {/* Canteens Used */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-normal max-w-xs truncate">
                          {emp.CANTEENS_USED ? (
                            emp.CANTEENS_USED.split(", ").map((canName, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full mr-1 mb-1 border border-slate-200"
                              >
                                {canName}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* Total Monthly Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-slate-900">
                        {formatINR(emp.TOTAL_AMOUNT)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center print:hidden">
                        <button
                          onClick={() => handleOpenDetail(emp)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition-all border border-slate-200 flex items-center gap-1.5 mx-auto"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <td colSpan={3} className="py-3 px-4 uppercase text-slate-500 text-xs">
                    Grand Total ({employees.length} Employees)
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    {summary.totalDaysBooked}
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-600">
                    {summary.totalServed} Served / {summary.totalBookings} Total
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">—</td>
                  <td className="py-3 px-4 text-right text-base text-orange-600 font-mono">
                    {formatINR(summary.totalAmount)}
                  </td>
                  <td className="py-3 px-4 print:hidden" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Itemized Audit Breakdown Modal ── */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-orange-400">
                  <span>LOGIN ID: {selectedCustomer?.LOGINID}</span>
                  <span>•</span>
                  <span>CODE: {selectedCustomer?.EMPCODE || "N/A"}</span>
                </div>
                <h3 className="text-lg font-bold text-white font-grotesk mt-0.5">
                  {selectedCustomer?.FULLNAME} — Monthly Itemized Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedCustomer?.DEPT} • {selectedCustomer?.DESIG}{" "}
                  {selectedCustomer?.CENTERNAME && `(${selectedCustomer.CENTERNAME})`}
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {breakdownLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-medium">Fetching itemized bookings...</p>
                </div>
              ) : breakdownError ? (
                <div className="py-12 text-center text-rose-500 space-y-2">
                  <XCircleIcon className="w-8 h-8 mx-auto" />
                  <p className="text-sm font-semibold">{breakdownError}</p>
                </div>
              ) : !breakdownData?.bookings || breakdownData.bookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">No active bookings recorded for this period.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {breakdownData.bookings.map((booking) => (
                    <div
                      key={booking.BOOKID}
                      className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3"
                    >
                      {/* Booking Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {booking.SERVICEDATE}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {booking.SERVNAME}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
                            {booking.CANTEENNAME}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              booking.STATUSCODE === "SRV"
                                ? "bg-emerald-100 text-emerald-800"
                                : booking.STATUSCODE === "NOS"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {booking.STATUSNAME || booking.STATUSCODE}
                          </span>
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {formatINR(booking.TOTALAMOUNT)}
                          </span>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="divide-y divide-slate-100 text-xs">
                        {booking.ITEMS?.map((item) => (
                          <div
                            key={item.BOOKITEMID}
                            className="py-1.5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              <span className="font-medium text-slate-800">
                                {item.ITEMNAME}
                              </span>
                              {item.MENUCODE && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({item.MENUCODE})
                                </span>
                              )}
                              <span className="text-slate-500 font-mono font-semibold">
                                × {item.QTY}
                              </span>
                            </div>
                            <div className="font-mono text-slate-600">
                              {formatINR(item.AMOUNT)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Total Month Deduction:{" "}
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatINR(selectedCustomer?.TOTAL_AMOUNT)}
                </span>
              </div>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
