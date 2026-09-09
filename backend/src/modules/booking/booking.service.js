import * as bookingRepository from "./booking.repository.js";
import * as daymenuRepository from "../daymenu/daymenu.repository.js";
import { pool } from "../../db/connection.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/appError.js";

export const getBooking = async (bookingId, user = null) => {
  const booking = await bookingRepository.getBooking(bookingId);
  if (!booking.HEADER) {
    throw new NotFoundError("Booking not found");
  }

  if (user && user.CUSTOMERID && booking.HEADER.CUSTOMERID !== user.CUSTOMERID) {
    throw new ForbiddenError("You do not have permission to view this booking");
  }

  return booking;
};

export const getActiveBooking = async ({ customerId, canteenId, serviceId, serviceDate }) => {
  const activeBooking = await bookingRepository.getActiveBookingForContext({
    customerId,
    canteenId,
    serviceId,
    serviceDate,
  });

  return activeBooking;
};

export const listBookings = async (filters, user = null) => {
  // If user is a customer, enforce their own customerId
  const finalFilters = { ...filters };
  if (user && user.CUSTOMERID) {
    finalFilters.PCUSTOMERID = user.CUSTOMERID;
  }
  return await bookingRepository.listBookings(finalFilters);
};

export const fetchKitchenPrep = async (daySlotId) => {
  return await bookingRepository.getKitchenPrep(daySlotId);
};

export const createBooking = async (data, user) => {
  const customerId = user?.CUSTOMERID || data.PCUSTOMERID;

  // Validate BOOKUNTIL
  if (data.PITEMSJSON && data.PITEMSJSON.length > 0) {
    const now = new Date();
    for (const item of data.PITEMSJSON) {
      const menuDetail = await daymenuRepository.getDayMenuById(item.DAYMENUID);
      if (menuDetail && menuDetail.BOOKUNTIL) {
        const bookUntil = new Date(menuDetail.BOOKUNTIL);
        if (now > bookUntil) {
          throw new BadRequestError(`Booking window has closed for item: ${menuDetail.ITEMNAME}`);
        }
      }
    }
  }

  return await bookingRepository.createBooking({
    ...data,
    PCUSTOMERID: customerId,
    PBOOKEDBY: user.USERID,
  });
};

export const addBookingItem = async (bookingId, itemData, user) => {
  return await bookingRepository.addBookingItemIncremental({
    bookingId: Number(bookingId),
    dayMenuId: Number(itemData.DAYMENUID),
    qty: Number(itemData.QTY),
    userId: user.USERID,
    customerId: user.CUSTOMERID,
    ctypeCode: user.CTYPECODE,
  });
};

export const updateBookingItemQty = async (bookingId, itemId, data, user) => {
  const qty = data.QTY !== undefined ? data.QTY : data.PQTY;
  return await bookingRepository.updateBookingItemQtyIncremental({
    bookingId: Number(bookingId),
    itemId: Number(itemId),
    qty: Number(qty),
    userId: user.USERID,
    customerId: user.CUSTOMERID,
    ctypeCode: user.CTYPECODE,
  });
};

export const cancelBookingItem = async (bookingId, itemId, data, user) => {
  return await bookingRepository.cancelBookingItemIncremental({
    bookingId: Number(bookingId),
    itemId: Number(itemId),
    cancelReason: data?.PCANCELREASON || null,
    userId: user.USERID,
    customerId: user.CUSTOMERID,
    ctypeCode: user.CTYPECODE,
  });
};

export const cancelBooking = async (bookingId, data, user) => {
  const bookingInfo = await bookingRepository.getBooking(bookingId);
  if (!bookingInfo || !bookingInfo.HEADER) {
    throw new NotFoundError("Booking not found");
  }

  if (user && user.CUSTOMERID && bookingInfo.HEADER.CUSTOMERID !== user.CUSTOMERID) {
    throw new ForbiddenError("You do not have permission to cancel this booking");
  }

  // Validate BOOKUNTIL for all active items in the booking
  const now = new Date();
  const activeItems = (bookingInfo.ITEMS || []).filter(
    (item) => item.STATUSCODE === "CRT" || item.STATUSID === 30
  );

  for (const item of activeItems) {
    const menuDetail = await daymenuRepository.getDayMenuById(item.DAYMENUID);
    if (menuDetail && menuDetail.BOOKUNTIL) {
      const bookUntil = new Date(menuDetail.BOOKUNTIL);
      if (now > bookUntil) {
        throw new BadRequestError(`Cancellation window has closed for item: ${menuDetail.ITEMNAME}`);
      }
    }
  }

  return await bookingRepository.cancelBooking({
    PBOOKINGID: Number(bookingId),
    ...data,
    PCANCELLEDBY: user.USERID,
  });
};

export const serveBooking = async (bookingId, data, userId, kioskId = null) => {
  return await bookingRepository.serveBooking({
    PBOOKINGID: Number(bookingId),
    ...data,
    PSERVEDBY: userId,
    PKIOSKID: kioskId,
  });
};

const executeNoShowRawSql = async ({ bookingId, userId, reason }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[booking]] = await conn.query(
      `SELECT B.BOOKID, B.STATUSID, ST.STATUSCODE
       FROM CMS_BOOKING B
       JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
       WHERE B.BOOKID = ? FOR UPDATE`,
      [bookingId]
    );

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.STATUSCODE === "NOS" || booking.STATUSID === 34) {
      await conn.commit();
      return [[{ BOOKID: bookingId, STATUSID: 34, STATUSCODE: "NOS", ALREADY_NOSHOW: 1 }]];
    }

    if (booking.STATUSCODE !== "CRT" && booking.STATUSID !== 30) {
      throw new BadRequestError("Booking cannot be marked as no-show from its current state");
    }

    // Insert history snapshot into CMS_BOOKHIST
    const [histResult] = await conn.query(
      `INSERT INTO CMS_BOOKHIST (
         BOOKID, BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
         STATUSID, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
         BOOKEDBY, BOOKEDON, CANCELLEDBY, CANCELLEDON, SERVEDBY, SERVEDON, NOSHOWON,
         KIOSKID,
         REMARKS, CREATEDBY, CREATEDAT, UPDATEDBY, UPDATEDAT, CHANGEDBY, CHGREASON
       )
       SELECT
         BOOKID, BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
         STATUSID, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
         BOOKEDBY, BOOKEDON, CANCELLEDBY, CANCELLEDON, SERVEDBY, SERVEDON, CURRENT_TIMESTAMP,
         KIOSKID,
         REMARKS, CREATEDBY, CREATEDAT, UPDATEDBY, UPDATEDAT, ?, ?
       FROM CMS_BOOKING
       WHERE BOOKID = ?`,
      [userId, reason || "Staff marked no-show", bookingId]
    );

    const histId = histResult.insertId;

    // Snapshot items into CMS_BOOKITMHS
    await conn.query(
      `INSERT INTO CMS_BOOKITMHS (BOOKHISTID, BOOKITEMID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID)
       SELECT ?, BOOKITEMID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID
       FROM CMS_BOOKITEM
       WHERE BOOKID = ?`,
      [histId, bookingId]
    );

    // Update CMS_BOOKING to NOS (status 34)
    await conn.query(
      `UPDATE CMS_BOOKING
       SET STATUSID = 34,
           NOSHOWON = CURRENT_TIMESTAMP,
           UPDATEDBY = ?,
           UPDATEDAT = CURRENT_TIMESTAMP
       WHERE BOOKID = ?`,
      [userId, bookingId]
    );

    // Update CMS_BOOKITEM to NOS (status 34) for pending items
    await conn.query(
      `UPDATE CMS_BOOKITEM
       SET STATUSID = 34,
           UPDATEDAT = CURRENT_TIMESTAMP
       WHERE BOOKID = ? AND (STATUSID = 30 OR STATUSID IS NULL)`,
      [bookingId]
    );

    // Remove from active pre-booking queue
    await conn.query(
      `DELETE FROM CMS_PBACTIVE WHERE BOOKID = ?`,
      [bookingId]
    );

    await conn.commit();
    return [[{ BOOKID: bookingId, STATUSID: 34, STATUSCODE: "NOS", ALREADY_NOSHOW: 0 }]];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const noShowBooking = async (bookingId, data, userId) => {
  try {
    return await bookingRepository.noShowBooking({
      PBOOKINGID: Number(bookingId),
      ...data,
      PCHANGEDBY: userId,
    });
  } catch (err) {
    if (err.code === "ER_SP_DOES_NOT_EXIST") {
      return await executeNoShowRawSql({
        bookingId: Number(bookingId),
        userId,
        reason: data?.PCHGREASON,
      });
    }
    throw err;
  }
};

export const toggleKiosk = async (dayMenuId, data, userId) => {
  return await bookingRepository.toggleKiosk({
    PDAYMENUID: Number(dayMenuId),
    ...data,
    PCHANGEDBY: userId,
  });
};

export const scanRfid = async (rfidHash, serviceId) => {
  const bookings = await bookingRepository.getBookingsByRfid(rfidHash, serviceId);

  if (!bookings || bookings.length === 0) {
    throw new NotFoundError("No active bookings found for this RFID");
  }
};

export const serveBookingItem = async (bookingId, itemId, data, userId) => {
  return await bookingRepository.serveBookingItem({
    PBOOKINGID: Number(bookingId),
    PBOOKITEMID: Number(itemId),
    PSERVEDBY: userId,
    PKIOSKID: data?.PKIOSKID || null,
    PCHGREASON: data?.PSERVEREASON || data?.CHGREASON || "Served at counter",
  });
};

export const resolveBooking = async (identifier, canteenId = null, serviceId = null, kioskId = null, daySlotId = null) => {
  const booking = await bookingRepository.resolveBookingByIdentifier(identifier, canteenId, serviceId, kioskId, daySlotId);
  if (!booking) {
    throw new NotFoundError("No active booking found for this identifier");
  }
  return booking;
};

export const createWeeklyBookingBatch = async (data, user) => {
  const customerId = user?.CUSTOMERID || data.PCUSTOMERID;
  if (!customerId) {
    throw new BadRequestError("Customer profile not found");
  }

  const createdBookings = await bookingRepository.createWeeklyBookingBatch({
    PBOOKTYPECODE: data.PBOOKTYPECODE || "PB",
    PCUSTOMERID: customerId,
    PBOOKINGSJSON: data.PBOOKINGSJSON,
    PBOOKEDBY: user.USERID,
    PREMARKS: data.PREMARKS || "5-Day Weekly Pass",
  });

  return createdBookings;
};

export const getWeeklyPublishedMenu = async ({ canteenId, startDate, endDate }, user = null) => {
  const ctypeCode = user?.CTYPECODE || "VIS";
  const { menuItems, holidays } = await bookingRepository.getWeeklyPublishedMenu({
    canteenId,
    startDate,
    endDate,
    ctypeCode,
  });

  let existingBookings = [];
  if (user?.CUSTOMERID) {
    existingBookings = await bookingRepository.getExistingBookingsInRange({
      customerId: user.CUSTOMERID,
      startDate,
      endDate,
    });
  }

  // Helper to get pure 'YYYY-MM-DD' string without timezone shift
  const normalizeDateStr = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val.slice(0, 10);
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return String(val).slice(0, 10);
  };

  // Create an existing bookings map: "YYYY-MM-DD_SERVICEID" -> booking
  const existingBookingsMap = {};
  for (const eb of existingBookings) {
    const dateStr = normalizeDateStr(eb.SERVICEDATE);
    const key = `${dateStr}_${eb.SERVICEID}`;
    existingBookingsMap[key] = eb;
  }

  // Holiday dates set for O(1) lookup
  const holidayMap = {};
  for (const h of holidays) {
    const hDateStr = normalizeDateStr(h.HOLIDAYDATE);
    holidayMap[hDateStr] = h.HOLIDAYNAME;
  }

  // Group items by date and then by service
  const daysMap = {};
  for (const item of menuItems) {
    const dateStr = normalizeDateStr(item.SERVDATE);
    if (!daysMap[dateStr]) {
      daysMap[dateStr] = {
        date: dateStr,
        isHoliday: Boolean(holidayMap[dateStr]),
        holidayName: holidayMap[dateStr] || null,
        services: {},
      };
    }

    const sId = item.SERVICEID;
    if (!daysMap[dateStr].services[sId]) {
      const existingKey = `${dateStr}_${sId}`;
      daysMap[dateStr].services[sId] = {
        serviceId: sId,
        servCode: item.SERVCODE,
        servName: item.SERVNAME,
        startTime: item.STARTTIME,
        endTime: item.ENDTIME,
        existingBooking: existingBookingsMap[existingKey] || null,
        baseItem: null,
        items: [],
      };
    }

    daysMap[dateStr].services[sId].items.push(item);
    if (item.ISBASE === 1 && !daysMap[dateStr].services[sId].baseItem) {
      daysMap[dateStr].services[sId].baseItem = item;
    }
  }

  return {
    canteenId,
    startDate,
    endDate,
    holidays,
    daysMap,
    existingBookings,
  };
};

