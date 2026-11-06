import { pool } from "../../db/connection.js";

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
  PCANTEENID = null,
}) => {
  const [resultSets] = await pool.query("CALL CMSLISTBOOK(?, ?, ?, ?, ?, ?)", [
    PCUSTOMERID,
    PSERVICEID,
    PSTARTDATE,
    PENDDATE,
    PSTATUS,
    PCANTEENID,
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
  const [resultSets] = await pool.query(
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
  return resultSets[0] || [];
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

/**
 * Finds an active confirmed pre-booking header and items in a meal slot context
 */
export const getActiveBookingContext = async ({
  customerId,
  canteenId = null,
  serviceId,
  serviceDate,
}) => {
  const [results] = await pool.query(
    "CALL CMSGETACTIVEBOOKINGCTX(?, ?, ?, ?)",
    [
      Number(customerId),
      canteenId ? Number(canteenId) : null,
      Number(serviceId),
      serviceDate,
    ]
  );

  if (!results || !results[0] || results[0].length === 0) {
    return null;
  }

  return {
    HEADER: results[0][0],
    ITEMS: results[1] || [],
  };
};

/**
 * Atomically adds an item to an active booking with price check, capacity check, and wallet settlement
 */
export const addBookingItemIncremental = async ({
  bookingId,
  dayMenuId,
  qty,
  userId,
  remarks = null,
}) => {
  const [results] = await pool.query(
    "CALL CMSADDBOOKINGITEM(?, ?, ?, ?, ?)",
    [Number(bookingId), Number(dayMenuId), Number(qty), Number(userId), remarks || null]
  );
  return results[0]?.[0] || null;
};

/**
 * Atomically updates quantity of an item in an active booking with capacity check and wallet delta
 */
export const updateBookingItemQtyIncremental = async ({
  itemId,
  qty,
  userId,
  remarks = null,
}) => {
  const [results] = await pool.query(
    "CALL CMSUPDBOOKINGITEMQTY(?, ?, ?, ?)",
    [Number(itemId), Number(qty), Number(userId), remarks || null]
  );
  return results[0]?.[0] || null;
};

/**
 * Atomically cancels an item in an active booking with cutoff check and wallet refund
 */
export const cancelBookingItemIncremental = async ({
  itemId,
  userId,
  remarks = null,
}) => {
  const [results] = await pool.query(
    "CALL CMSCANCELBOOKINGITEM(?, ?, ?)",
    [Number(itemId), Number(userId), remarks || null]
  );
  return results[0]?.[0] || null;
};

/**
 * Fetches published menu items for a weekly date range with customer pricing
 */
export const getWeeklyMenuRange = async ({
  canteenId,
  startDate,
  endDate,
  ctypeCode = "VIS",
}) => {
  const [results] = await pool.query(
    "CALL CMSVIEWMENURANGE(?, ?, ?, ?)",
    [Number(canteenId), startDate, endDate, ctypeCode || "VIS"]
  );
  return results[0] || [];
};

/**
 * Fetches holidays within a date range (including recurring holidays)
 */
export const getHolidaysInRange = async (startDate, endDate) => {
  const [results] = await pool.query(
    "CALL CMSLISTHOLIDAYSRANGE(?, ?)",
    [startDate, endDate]
  );
  return results[0] || [];
};

/**
 * Fetches existing non-cancelled bookings for a customer in a date range
 */
export const getExistingBookingsInRange = async ({
  customerId,
  startDate,
  endDate,
}) => {
  const [results] = await pool.query(
    "CALL CMSLISTBOOKINGSOFRANGE(?, ?, ?)",
    [Number(customerId), startDate, endDate]
  );
  return results[0] || [];
};

/**
 * Fetches active confirmed bookings for today for a customer (used by RFID scanning)
 */
export const getTodayActiveBookings = async (customerId, serviceId = null) => {
  const [results] = await pool.query(
    "CALL CMSGETTODAYACTIVEBOOKINGS(?, ?)",
    [Number(customerId), serviceId ? Number(serviceId) : null]
  );
  return results[0] || [];
};

/**
 * Resolves a customer ID from user or visitor 10-digit mobile phone number
 */
export const findCustomerByPhone = async (phone) => {
  const [results] = await pool.query(
    "CALL CMSFINDCUSTBYPHONE(?)",
    [String(phone).trim()]
  );
  return results[0]?.[0] || null;
};

/**
 * Validates RFID access key value
 */
export const validateAccessKey = async (rfidHash) => {
  const [results] = await pool.query(
    "CALL CMSVALIDATEACCKEY(?)",
    [String(rfidHash).trim()]
  );
  return results[0]?.[0] || null;
};
