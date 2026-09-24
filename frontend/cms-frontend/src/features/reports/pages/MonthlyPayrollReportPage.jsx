import { useState, useEffect, useCallback } from "react";
import { reportApi } from "../api/reportApi";
import { getActiveCanteens } from "../../dayslot/api/daySlotsApi";
import {
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { exportPayrollCSV } from "../utils/payrollExport";
import PayrollFilterBar from "../components/payroll/PayrollFilterBar";
import PayrollKPISection from "../components/payroll/PayrollKPISection";
import PayrollDataTable from "../components/payroll/PayrollDataTable";
import EmployeeBreakdownModal from "../components/payroll/EmployeeBreakdownModal";

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
      setError(
        err.response?.data?.MESSAGE || "Failed to load monthly payroll report."
      );
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
      setBreakdownError(
        err.response?.data?.MESSAGE || "Failed to load itemized bookings."
      );
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

  const handleExport = () => {
    exportPayrollCSV(reportData, selectedMonth, selectedYear, MONTHS);
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
              onClick={handleExport}
              disabled={employees.length === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={fetchReport}
              disabled={loading}
              className="p-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
              title="Refresh Report"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Controls Card ── */}
      <PayrollFilterBar
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedCanteen={selectedCanteen}
        setSelectedCanteen={setSelectedCanteen}
        loginIdQuery={loginIdQuery}
        setLoginIdQuery={setLoginIdQuery}
        canteens={canteens}
        MONTHS={MONTHS}
      />

      {/* ── KPI Summary Cards ── */}
      <PayrollKPISection summary={summary} />

      {/* ── Main Data Table ── */}
      <PayrollDataTable
        loading={loading}
        error={error}
        employees={employees}
        summary={summary}
        handleOpenDetail={handleOpenDetail}
      />

      {/* ── Itemized Audit Breakdown Modal ── */}
      <EmployeeBreakdownModal
        detailModalOpen={detailModalOpen}
        selectedCustomer={selectedCustomer}
        breakdownLoading={breakdownLoading}
        breakdownError={breakdownError}
        breakdownData={breakdownData}
        handleCloseDetail={handleCloseDetail}
      />
    </div>
  );
}
