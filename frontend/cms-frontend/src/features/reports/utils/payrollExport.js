/**
 * Generates and downloads a CSV export of the monthly payroll deduction records.
 *
 * @param {Object} reportData - Object containing employees array and summary
 * @param {number|string} selectedMonth - 1-indexed month number
 * @param {number|string} selectedYear - 4-digit year
 * @param {Array} monthsList - Array of { value, label } month definitions
 */
export function exportPayrollCSV(reportData, selectedMonth, selectedYear, monthsList = []) {
  if (!reportData?.employees || reportData.employees.length === 0) {
    alert("No data available to export.");
    return;
  }

  const monthName =
    monthsList.find((m) => m.value === Number(selectedMonth))?.label ||
    selectedMonth;
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
}
