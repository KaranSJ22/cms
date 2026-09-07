import * as bookingRepository from "./booking.repository.js";
import * as daymenuRepository from "../daymenu/daymenu.repository.js";
import { pool } from "../../db/connection.js";

export const getBooking = async (bookingId, user = null) => {
  const booking = await bookingRepository.getBooking(bookingId);
  if (!booking.HEADER) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (user && user.CUSTOMERID && booking.HEADER.CUSTOMERID !== user.CUSTOMERID) {
    const error = new Error("You do not have permission to view this booking");
    error.statusCode = 403;
    throw error;
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
          const error = new Error(`Booking window has closed for item: ${menuDetail.ITEMNAME}`);
          error.statusCode = 400;
          throw error;
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
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (user && user.CUSTOMERID && bookingInfo.HEADER.CUSTOMERID !== user.CUSTOMERID) {
    const error = new Error("You do not have permission to cancel this booking");
    error.statusCode = 403;
    throw error;
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
        const error = new Error(`Cancellation window has closed for item: ${menuDetail.ITEMNAME}`);
        error.statusCode = 400;
        throw error;
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
      const err = new Error("Booking not found");
      err.statusCode = 404;
      throw err;
    }

    if (booking.STATUSCODE === "NOS" || booking.STATUSID === 34) {
      await conn.commit();
      return [[{ BOOKID: bookingId, STATUSID: 34, STATUSCODE: "NOS", ALREADY_NOSHOW: 1 }]];
    }

    if (booking.STATUSCODE !== "CRT" && booking.STATUSID !== 30) {
      const err = new Error("Booking cannot be marked as no-show from its current state");
      err.statusCode = 400;
      throw err;
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
    const error = new Error("No active bookings found for this RFID");
    error.statusCode = 404;
    throw error;
  }
};

export const serveBookingItem = async (bookingId, itemId, data, userId) => {
  return await bookingRepository.updateBookingItem({
    PBOOKINGID: Number(bookingId),
    PBOOKDTID: Number(itemId),
    PQTY: data.PQTY || 1,
    PSTATUS: 'SRV',
    PCHANGEDBY: userId,
    PCHGREASON: data.PSERVEREASON || 'Served at kiosk',
  });
};

export const resolveBooking = async (identifier, canteenId = null, serviceId = null, kioskId = null, daySlotId = null) => {
  const booking = await bookingRepository.resolveBookingByIdentifier(identifier, canteenId, serviceId, kioskId, daySlotId);
  if (!booking) {
    const error = new Error("No active booking found for this identifier");
    error.statusCode = 404;
    throw error;
  }
  return booking;
};

