import * as ReportRepository from "./report.repository.js";
import { pool } from "../../db/connection.js";
import { NotFoundError } from "../../common/errors/appError.js";

export const getKitchenSummary = async (daySlotId) => {
  const result = await ReportRepository.getKitchenSummary(daySlotId);
  return result;
};

/**
 * Monthly Payroll Summary for Permanent and Other Centre Employees.
 * Uses raw SQL queries per instruction (ready to convert to Stored Procedures).
 */
export const getMonthlyPayrollReport = async ({
  month,
  year,
  canteenId,
  customerType = "ALL",
  loginId = "",
}) => {
  const now = new Date();
  const targetYear = year ? parseInt(year, 10) : now.getFullYear();
  const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

  // Format date range YYYY-MM-01 to YYYY-MM-LastDay
  const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const endDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Customer Type filter
  let allowedTypes = ["PRM", "PERMEMP", "OCE", "OCEEMP"];
  const upperType = String(customerType).toUpperCase().trim();
  if (upperType === "PRM" || upperType === "PERMEMP") {
    allowedTypes = ["PRM", "PERMEMP"];
  } else if (upperType === "OCE" || upperType === "OCEEMP") {
    allowedTypes = ["OCE", "OCEEMP"];
  }

  const queryParams = [startDate, endDate];

  let canteenFilterClause = "";
  if (canteenId) {
    canteenFilterClause = " AND ds.CANTEENID = ? ";
    queryParams.push(parseInt(canteenId, 10));
  }

  // Type placeholders
  const typePlaceholders = allowedTypes.map(() => "?").join(", ");
  queryParams.push(...allowedTypes);

  let loginFilterClause = "";
  if (loginId && loginId.trim()) {
    loginFilterClause = " AND u.LOGINID LIKE ? ";
    queryParams.push(`%${loginId.trim()}%`);
  }

  const sql = `
    SELECT 
        c.CUSTOMERID,
        u.USERID,
        u.LOGINID,
        u.FULLNAME,
        c.CTYPECODE,
        CASE 
            WHEN c.CTYPECODE IN ('PRM', 'PERMEMP') THEN 'Permanent Employee'
            WHEN c.CTYPECODE IN ('OCE', 'OCEEMP') THEN 'Other Centre Employee'
            ELSE c.CTYPECODE
        END AS CTYPENAME,
        COALESCE(pe.EMPCODE, oe.EMPCODE, u.LOGINID) AS EMPCODE,
        COALESCE(pe.DEPT, oe.DEPT, 'N/A') AS DEPT,
        COALESCE(pe.DESIG, oe.DESIG, 'N/A') AS DESIG,
        oe.CENTERNAME,
        COUNT(DISTINCT b.SERVICEDATE) AS DAYS_BOOKED,
        COUNT(DISTINCT b.BOOKID) AS TOTAL_BOOKINGS,
        SUM(CASE WHEN b.STATUSID = 32 THEN 1 ELSE 0 END) AS SERVED_BOOKINGS,
        SUM(CASE WHEN b.STATUSID = 34 THEN 1 ELSE 0 END) AS NOSHOW_BOOKINGS,
        SUM(CASE WHEN b.STATUSID = 30 THEN 1 ELSE 0 END) AS CREATED_BOOKINGS,
        COALESCE(SUM(b.TOTALAMOUNT), 0) AS TOTAL_AMOUNT,
        GROUP_CONCAT(DISTINCT can.CANTEENNAME ORDER BY can.CANTEENNAME SEPARATOR ', ') AS CANTEENS_USED
    FROM CMS_CUSTOMER c
    INNER JOIN CMS_USER u ON c.USERID = u.USERID
    LEFT JOIN CMS_PERMEMP pe ON c.CUSTOMERID = pe.CUSTOMERID
    LEFT JOIN CMS_OCEEMP oe ON c.CUSTOMERID = oe.CUSTOMERID
    INNER JOIN (
        SELECT 
            b.BOOKID,
            b.CUSTOMERID,
            b.SERVICEDATE,
            b.STATUSID,
            b.TOTALAMOUNT,
            MIN(ds.CANTEENID) AS CANTEENID
        FROM CMS_BOOKING b
        INNER JOIN CMS_BOOKITEM bi ON b.BOOKID = bi.BOOKID
        INNER JOIN CMS_DAYMENU dm ON bi.DAYMENUID = dm.DAYMENUID
        INNER JOIN CMS_DAYSLOT ds ON dm.DAYSLOTID = ds.DAYSLOTID
        WHERE b.STATUSID != 33
          AND b.SERVICEDATE >= ?
          AND b.SERVICEDATE <= ?
          ${canteenFilterClause}
        GROUP BY b.BOOKID, b.CUSTOMERID, b.SERVICEDATE, b.STATUSID, b.TOTALAMOUNT
    ) b ON c.CUSTOMERID = b.CUSTOMERID
    INNER JOIN CMS_CANTEEN can ON b.CANTEENID = can.CANTEENID
    WHERE c.CTYPECODE IN (${typePlaceholders})
      ${loginFilterClause}
    GROUP BY 
        c.CUSTOMERID, 
        u.USERID, 
        u.LOGINID, 
        u.FULLNAME, 
        c.CTYPECODE, 
        pe.EMPCODE, 
        oe.EMPCODE, 
        pe.DEPT, 
        oe.DEPT, 
        pe.DESIG, 
        oe.DESIG, 
        oe.CENTERNAME
    ORDER BY u.LOGINID ASC;
  `;

  const [rows] = await pool.query(sql, queryParams);

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
  const now = new Date();
  const targetYear = year ? parseInt(year, 10) : now.getFullYear();
  const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const endDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // 1. Fetch employee basic info
  const [empRows] = await pool.query(
    `
    SELECT 
        c.CUSTOMERID,
        u.USERID,
        u.LOGINID,
        u.FULLNAME,
        c.CTYPECODE,
        COALESCE(pe.EMPCODE, oe.EMPCODE, u.LOGINID) AS EMPCODE,
        COALESCE(pe.DEPT, oe.DEPT, 'N/A') AS DEPT,
        COALESCE(pe.DESIG, oe.DESIG, 'N/A') AS DESIG,
        oe.CENTERNAME
    FROM CMS_CUSTOMER c
    INNER JOIN CMS_USER u ON c.USERID = u.USERID
    LEFT JOIN CMS_PERMEMP pe ON c.CUSTOMERID = pe.CUSTOMERID
    LEFT JOIN CMS_OCEEMP oe ON c.CUSTOMERID = oe.CUSTOMERID
    WHERE c.CUSTOMERID = ?
    LIMIT 1
  `,
    [customerId]
  );

  if (!empRows.length) {
    throw new NotFoundError("Employee profile not found");
  }

  const employee = empRows[0];

  // 2. Fetch booking headers directly from CMS_BOOKING
  const [bookingRows] = await pool.query(
    `
    SELECT 
        b.BOOKID,
        b.BOOKNO,
        DATE_FORMAT(b.SERVICEDATE, '%Y-%m-%d') AS SERVICEDATE,
        b.SERVICEID,
        COALESCE(s.SERVNAME, 'Meal Service') AS SERVNAME,
        b.STATUSID,
        COALESCE(st.STATUSCODE, 'CRT') AS STATUSCODE,
        COALESCE(st.STATUSNAME, 'Confirmed') AS STATUSNAME,
        b.TOTALQTY,
        b.TOTALAMOUNT,
        b.BOOKEDON,
        b.SERVEDON
    FROM CMS_BOOKING b
    LEFT JOIN CMS_SERVICE s ON b.SERVICEID = s.SERVICEID
    LEFT JOIN CMS_STATUS st ON b.STATUSID = st.STATUSID
    WHERE b.CUSTOMERID = ?
      AND b.STATUSID != 33
      AND b.SERVICEDATE >= ?
      AND b.SERVICEDATE <= ?
    ORDER BY b.SERVICEDATE DESC, b.BOOKID DESC
  `,
    [customerId, startDate, endDate]
  );

  // 3. Fetch items and canteen details for all these bookings
  const bookIds = bookingRows.map((b) => b.BOOKID);
  let itemsMap = {};
  let canteenMap = {};

  if (bookIds.length > 0) {
    const placeholders = bookIds.map(() => "?").join(", ");
    const [itemRows] = await pool.query(
      `
      SELECT 
          bi.BOOKID,
          bi.BOOKITEMID,
          COALESCE(mi.ITEMNAME, 'Dish Item') AS ITEMNAME,
          mi.SHORTNAME,
          mi.MENUCODE,
          bi.QTY,
          bi.RATE,
          bi.AMOUNT,
          can.CANTEENNAME,
          can.CANTEENCODE
      FROM CMS_BOOKITEM bi
      LEFT JOIN CMS_MENUITEM mi ON bi.MENUITEMID = mi.MENUITEMID
      LEFT JOIN CMS_DAYMENU dm ON bi.DAYMENUID = dm.DAYMENUID
      LEFT JOIN CMS_DAYSLOT ds ON dm.DAYSLOTID = ds.DAYSLOTID
      LEFT JOIN CMS_CANTEEN can ON ds.CANTEENID = can.CANTEENID
      WHERE bi.BOOKID IN (${placeholders})
    `,
      bookIds
    );

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
    CANTEENNAME: canteenMap[b.BOOKID] || "Main Canteen",
    ITEMS: itemsMap[b.BOOKID] || [],
  }));

  return {
    employee,
    period: { year: targetYear, month: targetMonth, startDate, endDate },
    bookings: detailedBookings,
  };
};
