import { pool } from "../../db/connection.js";

/**
 * Booking Repository
 * Centralized data access layer for customer meal bookings.
 * 100% Stored Procedures (SPs).
 */

export const getBooking = async (bookingId) => {
  const [resultSets] = await pool.query("CALL CMSGETBOOK(?)", [bookingId]);
  return {
    HEADER: resultSets[0]?.[0] || null,
    ITEMS: resultSets[1] || [],
  };
};

export const getKitchenPrep = async (daySlotId) => {
  const [resultSets] = await pool.query("CALL CMSLISTKITCHENPREP(?)", [daySlotId]);
  return resultSets[0] || [];
};

export const listBookings = async ({
  PCUSTOMERID = null,
  PSERVICEID = null,
  PSTARTDATE = null,
  PENDDATE = null,
  PSTATUS = null,
}) => {
  const [resultSets] = await pool.query("CALL CMSLISTBOOK(?, ?, ?, ?, ?)", [
    PCUSTOMERID,
    PSERVICEID,
    PSTARTDATE,
    PENDDATE,
    PSTATUS,
  ]);
  return resultSets[0] || [];
};

export const listBookingHistory = async ({
  customerId,
  startDate = null,
  endDate = null,
  statusCode = null,
  page = 1,
  pageSize = 10,
}) => {
  let resultSets;
  let isLegacySp = false;

  try {
    const [res] = await pool.query(
      "CALL CMSLISTBOOKHISTORY(?, ?, ?, ?, ?, ?)",
      [
        customerId,
        startDate,
        endDate,
        statusCode,
        Number(page) || 1,
        Number(pageSize) || 10,
      ]
    );
    resultSets = res;
  } catch (err) {
    if (err.code === "ER_SP_WRONG_NO_OF_ARGS" || err.errno === 1318) {
      const [res] = await pool.query(
        "CALL CMSLISTBOOKHISTORY(?, ?, ?, ?)",
        [customerId, startDate, endDate, statusCode]
      );
      resultSets = res;
      isLegacySp = true;
    } else {
      throw err;
    }
  }

  const rows = resultSets[0] || [];
  if (isLegacySp) {
    const totalRows = rows.length;
    const limit = Number(pageSize) || 10;
    const currentPage = Number(page) || 1;
    const totalPages = totalRows > 0 ? Math.ceil(totalRows / limit) : 1;
    const offset = (currentPage - 1) * limit;
    const pagedRows = rows.slice(offset, offset + limit);

    return {
      rows: pagedRows,
      pagination: {
        totalRows,
        currentPage,
        pageSize: limit,
        totalPages,
      },
    };
  }

  const totalRows = rows[0]?.TOTALROWS || 0;
  const totalPages = rows[0]?.TOTALPAGES || (totalRows > 0 ? Math.ceil(totalRows / (Number(pageSize) || 10)) : 1);
  const currentPage = rows[0]?.CURRENTPAGE || Number(page) || 1;
  const limit = rows[0]?.PAGESIZE || Number(pageSize) || 10;

  return {
    rows,
    pagination: {
      totalRows: Number(totalRows),
      currentPage: Number(currentPage),
      pageSize: Number(limit),
      totalPages: Number(totalPages),
    },
  };
};

export const createBooking = async ({
  PBOOKTYPECODE,
  PCUSTOMERID,
  PSERVICEID,
  PSERVICEDATE,
  PITEMSJSON,
  PBOOKEDBY,
  PREMARKS,
}) => {
  const [result] = await pool.query(
    "CALL CMSADDBOOK(?, ?, ?, ?, ?, ?, ?)",
    [
      PBOOKTYPECODE,
      PCUSTOMERID,
      PSERVICEID,
      PSERVICEDATE,
      JSON.stringify(PITEMSJSON),
      PBOOKEDBY,
      PREMARKS || null,
    ]
  );
  return result;
};

export const createWeeklyBookingBatch = async ({
  PBOOKTYPECODE = "PB",
  PCUSTOMERID,
  PBOOKINGSJSON,
  PBOOKEDBY,
  PREMARKS = "5-Day Weekly Pass",
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSADDBOOKWEEKLY(?, ?, ?, ?, ?)",
    [
      PBOOKTYPECODE,
      PCUSTOMERID,
      JSON.stringify(PBOOKINGSJSON),
      PBOOKEDBY,
      PREMARKS || null,
    ]
  );
  return resultSets[0] || [];
};

export const updateBookingItem = async ({
  PBOOKINGID,
  PITEMSJSON,
  PCHANGEDBY,
}) => {
  const [result] = await pool.query(
    "CALL CMSUPDBOOKITEM(?, ?, ?)",
    [
      PBOOKINGID,
      typeof PITEMSJSON === "string" ? PITEMSJSON : JSON.stringify(PITEMSJSON || []),
      PCHANGEDBY,
    ]
  );
  return result;
};

export const serveBookingItem = async ({
  PBOOKINGID,
  PBOOKITEMID,
  PSERVEDBY,
  PKIOSKID = null,
  PCHGREASON = "Served at counter",
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSSERVEBOOKITEM(?, ?, ?, ?, ?)",
    [PBOOKINGID, PBOOKITEMID, PSERVEDBY, PKIOSKID, PCHGREASON]
  );
  return resultSets[0]?.[0] || null;
};

export const cancelBooking = async ({
  PBOOKINGID,
  PCANCELLEDBY,
  PISSTAFFOVERRIDE = 0,
  PCANCELREASON,
  CANCELREASON,
}) => {
  const reason = PCANCELREASON || CANCELREASON || "Cancelled by user";
  const override = PISSTAFFOVERRIDE ? 1 : 0;
  const [result] = await pool.query(
    "CALL CMSCANCELBOOK(?, ?, ?, ?)",
    [PBOOKINGID, PCANCELLEDBY, override, reason]
  );
  return result;
};

export const serveBooking = async ({
  PBOOKINGID,
  PSERVEDBY,
  PKIOSKID = null,
}) => {
  const [result] = await pool.query(
    "CALL CMSSERVEBOOK(?, ?, ?)",
    [PBOOKINGID, PSERVEDBY, PKIOSKID]
  );
  return result;
};

export const noShowBooking = async ({
  PBOOKINGID,
  PCHANGEDBY,
  PCHGREASON,
}) => {
  const [result] = await pool.query(
    "CALL CMSNOSHOWSINGLEBOOK(?, ?, ?)",
    [PBOOKINGID, PCHANGEDBY, PCHGREASON || null]
  );
  return result;
};

export const toggleKiosk = async ({
  PDAYMENUID,
  PISKIOSK,
  PCHANGEDBY,
}) => {
  const [result] = await pool.query(
    "CALL CMSTOGGLEKIOSK(?, ?, ?)",
    [PDAYMENUID, PISKIOSK, PCHANGEDBY]
  );
  return result;
};

export const resolveBookingByIdentifier = async (
  identifier,
  canteenId = null,
  serviceId = null,
  kioskId = null,
  daySlotId = null
) => {
  const trimmed = (identifier || "").trim();
  const [results] = await pool.query(
    "CALL CMSKIOSKRESOLVEBOOKING(?, ?, ?, ?)",
    [
      trimmed,
      canteenId ? Number(canteenId) : null,
      kioskId ? Number(kioskId) : null,
      daySlotId ? Number(daySlotId) : null,
    ]
  );

  if (!results || results.length < 2 || !results[0] || results[0].length === 0) {
    return null;
  }

  return {
    HEADER: results[0][0],
    ITEMS: results[1] || [],
  };
};
