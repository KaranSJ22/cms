import * as ReportRepository from "./report.repository.js";
import { NotFoundError } from "../../common/errors/appError.js";
import { getMonthDateRange } from "../../utils/dateTime.js";

export const getKitchenSummary = async (daySlotId) => {
  const result = await ReportRepository.getKitchenSummary(daySlotId);
  return result;
};

export const findMonthlyPayrollData = async ({
  startDate,
  endDate,
  canteenId,
  allowedTypes,
  customerType,
  loginId,
}) => {
  let cType = customerType;
  if (!cType && Array.isArray(allowedTypes)) {
    const hasPrm = allowedTypes.some((t) => ["PRM", "PERMEMP"].includes(t));
    const hasOce = allowedTypes.some((t) => ["OCE", "OCEEMP"].includes(t));
    if (hasPrm && !hasOce) cType = "PRM";
    else if (!hasPrm && hasOce) cType = "OCE";
    else cType = "ALL";
  }

  return await ReportRepository.getMonthlyPayrollData({
    startDate,
    endDate,
    canteenId,
    customerType: cType || "ALL",
    loginId,
  });
};

export const findEmployeeProfile = async (customerId) => {
  return await ReportRepository.getEmployeeProfile(customerId);
};

export const findEmployeeMonthlyBookings = async ({ customerId, startDate, endDate }) => {
  return await ReportRepository.getEmployeeMonthlyBookings({ customerId, startDate, endDate });
};

export const findBookingItemsWithCanteen = async (bookIds) => {
  return await ReportRepository.getBookingItemsWithCanteen(bookIds);
};

/**
 * Monthly Payroll Summary for Permanent and Other Centre Employees.
 */
export const getMonthlyPayrollReport = async ({
  month,
  year,
  canteenId,
  customerType = "ALL",
  loginId = "",
}) => {
  const { startDate, endDate, targetYear, targetMonth } = getMonthDateRange(year, month);

  // Customer Type filter
  let cType = "ALL";
  const upperType = String(customerType).toUpperCase().trim();
  if (upperType === "PRM" || upperType === "PERMEMP") {
    cType = "PRM";
  } else if (upperType === "OCE" || upperType === "OCEEMP") {
    cType = "OCE";
  }

  const rows = await ReportRepository.getMonthlyPayrollData({
    startDate,
    endDate,
    canteenId,
    customerType: cType,
    loginId,
  });

  // Compute aggregate totals for KPI cards
  const totalEmployees = rows.length;
  let totalDaysBooked = 0;
  let totalBookings = 0;
  let totalServed = 0;
  let totalNoShow = 0;
  let totalAmount = 0;

  for (const r of rows) {
    totalDaysBooked += Number(r.DAYS_BOOKED) || 0;
    totalBookings += Number(r.TOTAL_BOOKINGS) || 0;
    totalServed += Number(r.SERVED_BOOKINGS) || 0;
    totalNoShow += Number(r.NOSHOW_BOOKINGS) || 0;
    totalAmount += Number(r.TOTAL_AMOUNT) || 0;
  }

  return {
    period: {
      year: targetYear,
      month: targetMonth,
      startDate,
      endDate,
    },
    summary: {
      totalEmployees,
      totalDaysBooked,
      totalBookings,
      totalServed,
      totalNoShow,
      totalAmount: Math.round(totalAmount * 100) / 100,
    },
    employees: rows,
  };
};

/**
 * Itemized breakdown of an employee's monthly meal bookings for audit and verification.
 */
export const getEmployeeMonthlyPayrollBreakdown = async ({
  customerId,
  month,
  year,
}) => {
  const { startDate, endDate, targetYear, targetMonth } = getMonthDateRange(year, month);

  // 1. Fetch employee basic info
  const employee = await ReportRepository.getEmployeeProfile(customerId);

  if (!employee) {
    throw new NotFoundError("Employee profile not found");
  }

  // 2. Fetch booking headers
  const bookingRows = await ReportRepository.getEmployeeMonthlyBookings({
    customerId,
    startDate,
    endDate,
  });

  // 3. Fetch items and canteen details for all these bookings
  const bookIds = bookingRows.map((b) => b.BOOKID);
  let itemsMap = {};
  let canteenMap = {};

  if (bookIds.length > 0) {
    const itemRows = await ReportRepository.getBookingItemsWithCanteen(bookIds);

    for (const item of itemRows) {
      if (!itemsMap[item.BOOKID]) {
        itemsMap[item.BOOKID] = [];
      }
      itemsMap[item.BOOKID].push(item);

      if (item.CANTEENNAME && !canteenMap[item.BOOKID]) {
        canteenMap[item.BOOKID] = item.CANTEENNAME;
      }
    }
  }

  const detailedBookings = bookingRows.map((b) => ({
    ...b,
    CANTEENNAME: canteenMap[b.BOOKID] || "Canteen A",
    ITEMS: itemsMap[b.BOOKID] || [],
  }));

  return {
    employee,
    period: { year: targetYear, month: targetMonth, startDate, endDate },
    bookings: detailedBookings,
  };
};
