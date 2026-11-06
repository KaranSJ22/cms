import { pool } from "../../db/connection.js";

/**
 * Retrieves kitchen preparation summary and customer-type breakdown for a day slot.
 */
export const getKitchenSummary = async (PDAYSLOTID) => {
  const [resultSets] = await pool.query("CALL CMSGETKITCHENSUMMARY(?)", [PDAYSLOTID]);
  return {
    summary: resultSets[0] || [],
    breakdownByCustomerType: resultSets[1] || [],
  };
};

/**
 * Retrieves monthly payroll recovery aggregates for permanent and OCE employees.
 */
export const getMonthlyPayrollData = async ({
  startDate,
  endDate,
  canteenId = null,
  customerType = "ALL",
  loginId = null,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSREPORTMONTHLYPAYROLL(?, ?, ?, ?, ?)",
    [
      startDate,
      endDate,
      canteenId ? parseInt(canteenId, 10) : null,
      customerType || "ALL",
      loginId && loginId.trim() ? loginId.trim() : null,
    ]
  );
  return resultSets[0] || [];
};

/**
 * Retrieves employee profile for monthly payroll settlement slips.
 */
export const getEmployeeProfile = async (customerId) => {
  const [resultSets] = await pool.query("CALL CMSREPORTGETEMPLOYEEPROFILE(?)", [
    parseInt(customerId, 10),
  ]);
  const rows = resultSets[0] || [];
  return rows[0] || null;
};

/**
 * Retrieves monthly bookings for employee settlement slips.
 */
export const getEmployeeMonthlyBookings = async ({
  customerId,
  startDate,
  endDate,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSREPORTGETEMPLOYEEBOOKINGS(?, ?, ?)",
    [parseInt(customerId, 10), startDate, endDate]
  );
  return resultSets[0] || [];
};

/**
 * Retrieves itemized breakdown with canteen details for a list of booking IDs.
 */
export const getBookingItemsWithCanteen = async (bookIds) => {
  if (!bookIds || bookIds.length === 0) return [];
  const ids = Array.isArray(bookIds) ? bookIds.map(Number).filter(Boolean) : [];
  if (ids.length === 0) return [];

  const [resultSets] = await pool.query("CALL CMSREPORTGETBOOKINGITEMS(?)", [
    JSON.stringify(ids),
  ]);
  return resultSets[0] || [];
};
