import * as bookingRepository from "./booking.repository.js";
import * as daymenuService from "../daymenu/daymenu.service.js";
import { pool } from "../../db/connection.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/appError.js";
import { isPastCutoff, toMySQLDate } from "../../utils/dateTime.js";

// ===========================================================================
// RAW SQL PROTOTYPING & WORKFLOW HELPERS (Pre-Stored Procedure Stage)
// ===========================================================================

/**
 * Resolves an auto-generated unique number from CMSGENAUTO within an open connection.
 */
async function genAutoNo(conn, tableName, columnName) {
  await conn.execute(`CALL CMSGENAUTO(?, ?, @__autono)`, [tableName, columnName]);
  const [[row]] = await conn.execute(`SELECT @__autono AS AUTONO`);
  return row.AUTONO;
}

/**
 * Atomically adjusts wallet balance and creates an immutable audit transaction
 * for pre-booking incremental edits (refunds on cancellations, charges on additions).
 * Zero RESERVEDAMT hold logic is used.
 */
async function adjustBookingWalletLedger(conn, {
  customerId,
  bookingId,
  amountDiff, // negative = refund, positive = charge
  userId,
  remarks,
}) {
  if (!amountDiff || amountDiff === 0) return;

  const [[cust]] = await conn.query(
    `SELECT C.CUSTOMERID, CT.CTYPECODE
     FROM CMS_CUSTOMER C
     JOIN CMS_CUSTOMERTYPE CT ON CT.CTYPEID = C.CTYPEID
     WHERE C.CUSTOMERID = ?`,
    [customerId]
  );

  if (!cust || !["CNT", "VIS", "CONTEMP", "VISITOR"].includes(cust.CTYPECODE)) {
    return;
  }

  const [[wallet]] = await conn.query(
    `SELECT W.WALLETID, W.BALANCE
     FROM CMS_WALLET W
     JOIN CMS_STATUS ST ON ST.STATUSID = W.STATUSID
     WHERE W.CUSTOMERID = ? AND ST.STATUSCODE = 'ACT'
     FOR UPDATE`,
    [customerId]
  );

  if (!wallet) {
    throw new BadRequestError("Active wallet not found for customer");
  }

  const currentBal = Number(wallet.BALANCE);

  if (amountDiff < 0) {
    // Refund to wallet balance
    const refundAmt = Math.abs(amountDiff);
    const newBal = Number((currentBal + refundAmt).toFixed(2));

    await conn.query(
      `UPDATE CMS_WALLET SET BALANCE = ? WHERE WALLETID = ?`,
      [newBal, wallet.WALLETID]
    );

    const refNo = await genAutoNo(conn, "CMS_WALLETTRAN", "REFNO");

    await conn.query(
      `INSERT INTO CMS_WALLETTRAN
       (WALLETID, BOOKINGID, TRANSTYPE, SOURCECODE, AMOUNT, BALBEFORE, BALAFTER,
        PAYMENTMETHOD, REFNO, STATUSID, CREATEDBY, REMARKS)
       VALUES (?, ?, 'CREDIT', 'REFUND', ?, ?, ?, 'WALLET', ?, 40, ?, ?)`,
      [
        wallet.WALLETID,
        bookingId,
        refundAmt,
        currentBal,
        newBal,
        refNo,
        userId,
        remarks || "Pre-booking modification refund",
      ]
    );
  } else {
    // Additional debit from wallet balance
    const chargeAmt = amountDiff;
    if (chargeAmt > currentBal) {
      throw new BadRequestError(
        `Insufficient available wallet balance (Required: ₹${chargeAmt}, Available: ₹${currentBal})`
      );
    }

    const newBal = Number((currentBal - chargeAmt).toFixed(2));

    await conn.query(
      `UPDATE CMS_WALLET SET BALANCE = ? WHERE WALLETID = ?`,
      [newBal, wallet.WALLETID]
    );

    const refNo = await genAutoNo(conn, "CMS_WALLETTRAN", "REFNO");

    await conn.query(
      `INSERT INTO CMS_WALLETTRAN
       (WALLETID, BOOKINGID, TRANSTYPE, SOURCECODE, AMOUNT, BALBEFORE, BALAFTER,
        PAYMENTMETHOD, REFNO, STATUSID, CREATEDBY, REMARKS)
       VALUES (?, ?, 'DEBIT', 'BOOKING', ?, ?, ?, 'WALLET', ?, 44, ?, ?)`,
      [
        wallet.WALLETID,
        bookingId,
        chargeAmt,
        currentBal,
        newBal,
        refNo,
        userId,
        remarks || "Pre-booking modification additional charge",
      ]
    );
  }
}

/**
 * Helper to record booking history snapshot inside a transaction.
 */
async function recordBookingHistory(conn, bookingId, changedBy, changeReason) {
  const [histResult] = await conn.query(
    `INSERT INTO CMS_BOOKHIST (
       BOOKID, BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
       STATUSID, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
       BOOKEDBY, BOOKEDON, CANCELLEDBY, CANCELLEDON, SERVEDBY, SERVEDON, NOSHOWON,
       REMARKS, CREATEDBY, CREATEDAT, UPDATEDBY, UPDATEDAT, CHANGEDBY, CHGREASON
     )
     SELECT 
       BOOKID, BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
       STATUSID, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
       BOOKEDBY, BOOKEDON, CANCELLEDBY, CANCELLEDON, SERVEDBY, SERVEDON, NOSHOWON,
       REMARKS, CREATEDBY, CREATEDAT, UPDATEDBY, UPDATEDAT, ?, ?
     FROM CMS_BOOKING
     WHERE BOOKID = ?`,
    [changedBy, changeReason, bookingId]
  );

  const bookHistId = histResult.insertId;

  await conn.query(
    `INSERT INTO CMS_BOOKITMHS (
       BOOKHISTID, BOOKITEMID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID
     )
     SELECT ?, BOOKITEMID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID
     FROM CMS_BOOKITEM
     WHERE BOOKID = ?`,
    [bookHistId, bookingId]
  );

  return bookHistId;
}

/**
 * Finds an active pre-booking (STATUSID = 30 'CRT') for a customer in a specific canteen + service + serving date.
 */
export const getActiveBookingForContext = async ({
  customerId,
  canteenId,
  serviceId,
  serviceDate,
}) => {
  const [headers] = await pool.query(
    `SELECT 
       B.BOOKID, B.BOOKNO, B.BOOKTYPEID, BT.BOOKTYPECODE, BT.BOOKTYPENAME,
       B.CUSTOMERID, C.CTYPECODE, C.DISPNAME AS CUSTOMERNAME,
       B.SERVICEID, S.SERVNAME, B.SERVICEDATE,
       B.STATUSID, ST.STATUSCODE, B.TOTALITEMS, B.TOTALQTY, B.TOTALAMOUNT,
       B.BOOKEDBY, B.BOOKEDON, B.REMARKS,
       DS.CANTEENID, CAN.CANTEENNAME,
       MIN(DM.BOOKUNTIL) AS MIN_BOOKUNTIL,
       MAX(DM.BOOKUNTIL) AS MAX_BOOKUNTIL
     FROM CMS_BOOKING B
     JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID = B.BOOKTYPEID
     JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
     JOIN CMS_CUSTOMER C ON C.CUSTOMERID = B.CUSTOMERID
     JOIN CMS_SERVICE S ON S.SERVICEID = B.SERVICEID
     JOIN CMS_BOOKITEM BI ON BI.BOOKID = B.BOOKID
     JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
     JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
     JOIN CMS_CANTEEN CAN ON CAN.CANTEENID = DS.CANTEENID
     WHERE B.CUSTOMERID = ?
       AND DS.CANTEENID = ?
       AND B.SERVICEID = ?
       AND B.SERVICEDATE = ?
       AND ST.STATUSCODE = 'CRT'
     GROUP BY B.BOOKID, BT.BOOKTYPECODE, BT.BOOKTYPENAME, C.CTYPECODE, C.DISPNAME, S.SERVNAME, ST.STATUSCODE, DS.CANTEENID, CAN.CANTEENNAME
     LIMIT 1`,
    [customerId, canteenId, serviceId, serviceDate]
  );

  if (!headers || headers.length === 0) {
    return null;
  }

  const header = headers[0];

  const [items] = await pool.query(
    `SELECT 
       BI.BOOKITEMID, BI.BOOKID, BI.DAYMENUID, BI.MENUITEMID, MI.MENUCODE, MI.ITEMNAME, MI.SHORTNAME,
       BI.QTY, BI.RATE, BI.AMOUNT, BI.REMARKS, BI.STATUSID, ST.STATUSCODE,
       DM.BOOKUNTIL, DM.CANCELUNTIL, DM.MAXQTY, DM.AVAILQTY
     FROM CMS_BOOKITEM BI
     JOIN CMS_MENUITEM MI ON MI.MENUITEMID = BI.MENUITEMID
     JOIN CMS_STATUS ST ON ST.STATUSID = BI.STATUSID
     JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
     WHERE BI.BOOKID = ?
     ORDER BY BI.BOOKITEMID ASC`,
    [header.BOOKID]
  );

  return {
    HEADER: header,
    ITEMS: items || [],
  };
};

/**
 * Incrementally adds a new item to an existing active booking before BOOKUNTIL.
 */
export const addBookingItemIncremental = async ({
  bookingId,
  dayMenuId,
  qty,
  userId,
  customerId,
  ctypeCode,
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock and validate booking header
    const [[booking]] = await conn.query(
      `SELECT B.*, ST.STATUSCODE, BT.BOOKTYPECODE
       FROM CMS_BOOKING B
       JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
       JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID = B.BOOKTYPEID
       WHERE B.BOOKID = ? FOR UPDATE`,
      [bookingId]
    );

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (customerId && booking.CUSTOMERID !== customerId) {
      throw new ForbiddenError("You do not have permission to modify this booking");
    }

    if (booking.BOOKTYPECODE !== "PB") {
      throw new BadRequestError("Only pre-bookings can be updated");
    }

    if (booking.STATUSCODE !== "CRT") {
      throw new BadRequestError("Booking is not in an editable state");
    }

    // 2. Lock and validate DayMenu item
    const [[dayMenu]] = await conn.query(
      `SELECT DM.*, MI.ITEMNAME, DS.SERVICEID, DS.SERVDATE, DS.CANTEENID,
              DM_ST.STATUSCODE AS DM_STATUS, DS_ST.STATUSCODE AS DS_STATUS, DS_AST.STATUSCODE AS DS_APPRSTATUS
       FROM CMS_DAYMENU DM
       JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
       JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
       JOIN CMS_STATUS DM_ST ON DM_ST.STATUSID = DM.STATUSID
       JOIN CMS_STATUS DS_ST ON DS_ST.STATUSID = DS.STATUSID
       JOIN CMS_STATUS DS_AST ON DS_AST.STATUSID = DS.APPRSTATUSID
       WHERE DM.DAYMENUID = ? FOR UPDATE`,
      [dayMenuId]
    );

    if (!dayMenu) {
      throw new NotFoundError("Day menu item not found");
    }

    if (dayMenu.DM_STATUS !== "ACT" || dayMenu.DS_STATUS !== "ACT" || dayMenu.DS_APPRSTATUS !== "APR" || dayMenu.ISPREBOOK !== 1) {
      throw new BadRequestError("This item is not available for pre-booking");
    }

    const dmDateStr = toMySQLDate(dayMenu.SERVDATE);
    const bkDateStr = toMySQLDate(booking.SERVICEDATE);
    if (dayMenu.SERVICEID !== booking.SERVICEID || dmDateStr !== bkDateStr) {
      throw new BadRequestError("Item does not match the service and date of this booking");
    }

    // Check BOOKUNTIL cutoff
    if (isPastCutoff(dayMenu.BOOKUNTIL)) {
      throw new BadRequestError(`Booking window has closed for item: ${dayMenu.ITEMNAME}`);
    }

    if (qty < 1 || qty > dayMenu.MAXQTY) {
      throw new BadRequestError(`Quantity must be between 1 and ${dayMenu.MAXQTY}`);
    }

    // 3. Capacity check
    if (dayMenu.AVAILQTY !== null) {
      const [[capacity]] = await conn.query(
        `SELECT COALESCE(SUM(BI.QTY), 0) AS BOOKEDQTY
         FROM CMS_BOOKITEM BI
         JOIN CMS_BOOKING B ON B.BOOKID = BI.BOOKID
         JOIN CMS_STATUS BST ON BST.STATUSID = B.STATUSID
         WHERE BI.DAYMENUID = ?
           AND BI.STATUSID IN (30, 32, 34)
           AND BST.STATUSCODE IN ('CRT', 'SRV', 'NOS')
           AND B.BOOKID <> ?`,
        [dayMenuId, bookingId]
      );

      if (Number(capacity.BOOKEDQTY) + qty > dayMenu.AVAILQTY) {
        throw new BadRequestError(`Insufficient available capacity for item: ${dayMenu.ITEMNAME}`);
      }
    }

    // 4. Resolve item price
    const [[priceRow]] = await conn.query(
      `SELECT d.PRICE
       FROM CMS_ITEMPRICE p
       JOIN CMS_STATUS IP_ST ON IP_ST.STATUSID = p.STATUSID
       JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
       WHERE p.MENUITEMID = ?
         AND (d.CTYPECODE = ? OR d.CTYPECODE = 'VIS')
         AND p.EFFFROM <= ?
         AND IP_ST.STATUSCODE = 'ACT'
       ORDER BY p.EFFFROM DESC, CASE WHEN d.CTYPECODE = ? THEN 1 ELSE 2 END
       LIMIT 1`,
      [dayMenu.MENUITEMID, ctypeCode, booking.SERVICEDATE, ctypeCode]
    );

    const rate = priceRow ? Number(priceRow.PRICE) : 0;
    const amount = Number((qty * rate).toFixed(2));

    // 5. Check if item already exists in booking (active or cancelled)
    const [[existingItem]] = await conn.query(
      `SELECT BI.*, ST.STATUSCODE
       FROM CMS_BOOKITEM BI
       JOIN CMS_STATUS ST ON ST.STATUSID = BI.STATUSID
       WHERE BI.BOOKID = ? AND BI.DAYMENUID = ? FOR UPDATE`,
      [bookingId, dayMenuId]
    );

    if (existingItem && existingItem.STATUSCODE === "CRT") {
      throw new BadRequestError("This item already exists in the booking; use quantity update instead");
    }

    // 6. Handle wallet balance deduction for CNT / VIS
    await adjustBookingWalletLedger(conn, {
      customerId: booking.CUSTOMERID,
      bookingId,
      amountDiff: amount,
      userId,
      remarks: `Pre-booking item added: ${dayMenu.ITEMNAME}`,
    });

    let bookItemId;
    if (existingItem) {
      // Reactivate previously cancelled item with new quantity and rate
      await conn.query(
        `UPDATE CMS_BOOKITEM
         SET QTY = ?, RATE = ?, AMOUNT = ?, STATUSID = 30, UPDATEDAT = CURRENT_TIMESTAMP
         WHERE BOOKITEMID = ?`,
        [qty, rate, amount, existingItem.BOOKITEMID]
      );
      bookItemId = existingItem.BOOKITEMID;
    } else {
      // Insert new booking item
      const [insertRes] = await conn.query(
        `INSERT INTO CMS_BOOKITEM (BOOKID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, STATUSID)
         VALUES (?, ?, ?, ?, ?, ?, 30)`,
        [bookingId, dayMenuId, dayMenu.MENUITEMID, qty, rate, amount]
      );
      bookItemId = insertRes.insertId;
    }

    // 7. Recalculate header totals for all active items
    const [[totals]] = await conn.query(
      `SELECT COUNT(*) AS TOTALITEMS, COALESCE(SUM(QTY), 0) AS TOTALQTY, COALESCE(SUM(AMOUNT), 0) AS TOTALAMOUNT
       FROM CMS_BOOKITEM
       WHERE BOOKID = ? AND STATUSID = 30`,
      [bookingId]
    );

    await conn.query(
      `UPDATE CMS_BOOKING
       SET TOTALITEMS = ?, TOTALQTY = ?, TOTALAMOUNT = ?, UPDATEDBY = ?, UPDATEDAT = CURRENT_TIMESTAMP
       WHERE BOOKID = ?`,
      [totals.TOTALITEMS, totals.TOTALQTY, totals.TOTALAMOUNT, userId, bookingId]
    );

    // 8. Log audit history
    await recordBookingHistory(conn, bookingId, userId, `Added item: ${dayMenu.ITEMNAME} (Qty: ${qty})`);

    await conn.commit();

    return {
      BOOKITEMID: bookItemId,
      BOOKID: bookingId,
      DAYMENUID: dayMenuId,
      QTY: qty,
      RATE: rate,
      AMOUNT: amount,
      STATUSID: 30,
      STATUSCODE: "CRT",
      TOTALITEMS: totals.TOTALITEMS,
      TOTALQTY: totals.TOTALQTY,
      TOTALAMOUNT: totals.TOTALAMOUNT,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Incrementally modifies quantity of an existing active booking item before BOOKUNTIL.
 */
export const updateBookingItemQtyIncremental = async ({
  bookingId,
  itemId,
  qty,
  userId,
  customerId,
  ctypeCode,
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock and validate booking header
    const [[booking]] = await conn.query(
      `SELECT B.*, ST.STATUSCODE, BT.BOOKTYPECODE
       FROM CMS_BOOKING B
       JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
       JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID = B.BOOKTYPEID
       WHERE B.BOOKID = ? FOR UPDATE`,
      [bookingId]
    );

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (customerId && booking.CUSTOMERID !== customerId) {
      throw new ForbiddenError("You do not have permission to modify this booking");
    }

    if (booking.BOOKTYPECODE !== "PB") {
      throw new BadRequestError("Only pre-bookings can be updated");
    }

    if (booking.STATUSCODE !== "CRT") {
      throw new BadRequestError("Booking is not in an editable state");
    }

    // 2. Lock and validate booking item
    const [[item]] = await conn.query(
      `SELECT BI.*, ST.STATUSCODE, DM.BOOKUNTIL, DM.MAXQTY, DM.AVAILQTY, MI.ITEMNAME
       FROM CMS_BOOKITEM BI
       JOIN CMS_STATUS ST ON ST.STATUSID = BI.STATUSID
       JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
       JOIN CMS_MENUITEM MI ON MI.MENUITEMID = BI.MENUITEMID
       WHERE BI.BOOKITEMID = ? AND BI.BOOKID = ? FOR UPDATE`,
      [itemId, bookingId]
    );

    if (!item) {
      throw new NotFoundError("Booking item not found");
    }

    if (item.STATUSCODE !== "CRT") {
      throw new BadRequestError("Cannot modify quantity of a cancelled or served item");
    }

    // Check BOOKUNTIL cutoff
    if (isPastCutoff(item.BOOKUNTIL)) {
      throw new BadRequestError(`Booking window has closed for item: ${item.ITEMNAME}`);
    }

    if (qty < 1 || qty > item.MAXQTY) {
      throw new BadRequestError(`Quantity must be between 1 and ${item.MAXQTY}`);
    }

    const qtyDiff = qty - item.QTY;
    if (qtyDiff === 0) {
      await conn.rollback();
      return {
        BOOKITEMID: item.BOOKITEMID,
        BOOKID: bookingId,
        QTY: item.QTY,
        RATE: item.RATE,
        AMOUNT: item.AMOUNT,
        STATUSID: item.STATUSID,
        STATUSCODE: item.STATUSCODE,
      };
    }

    // 3. Capacity check if increasing quantity
    if (qtyDiff > 0 && item.AVAILQTY !== null) {
      const [[capacity]] = await conn.query(
        `SELECT COALESCE(SUM(BI.QTY), 0) AS BOOKEDQTY
         FROM CMS_BOOKITEM BI
         JOIN CMS_BOOKING B ON B.BOOKID = BI.BOOKID
         JOIN CMS_STATUS BST ON BST.STATUSID = B.STATUSID
         WHERE BI.DAYMENUID = ?
           AND BI.STATUSID IN (30, 32, 34)
           AND BST.STATUSCODE IN ('CRT', 'SRV', 'NOS')
           AND B.BOOKID <> ?`,
        [item.DAYMENUID, bookingId]
      );

      if (Number(capacity.BOOKEDQTY) + qty > item.AVAILQTY) {
        throw new BadRequestError(`Insufficient available capacity for item: ${item.ITEMNAME}`);
      }
    }

    const newAmount = Number((qty * Number(item.RATE)).toFixed(2));
    const amountDiff = Number((qtyDiff * Number(item.RATE)).toFixed(2));

    // 4. Handle wallet balance adjustment
    await adjustBookingWalletLedger(conn, {
      customerId: booking.CUSTOMERID,
      bookingId,
      amountDiff: amountDiff,
      userId,
      remarks: `Pre-booking item qty updated (${item.QTY} -> ${qty}): ${item.ITEMNAME}`,
    });

    // 5. Update item
    await conn.query(
      `UPDATE CMS_BOOKITEM
       SET QTY = ?, AMOUNT = ?, UPDATEDAT = CURRENT_TIMESTAMP
       WHERE BOOKITEMID = ?`,
      [qty, newAmount, itemId]
    );

    // 6. Recalculate header totals
    const [[totals]] = await conn.query(
      `SELECT COUNT(*) AS TOTALITEMS, COALESCE(SUM(QTY), 0) AS TOTALQTY, COALESCE(SUM(AMOUNT), 0) AS TOTALAMOUNT
       FROM CMS_BOOKITEM
       WHERE BOOKID = ? AND STATUSID = 30`,
      [bookingId]
    );

    await conn.query(
      `UPDATE CMS_BOOKING
       SET TOTALITEMS = ?, TOTALQTY = ?, TOTALAMOUNT = ?, UPDATEDBY = ?, UPDATEDAT = CURRENT_TIMESTAMP
       WHERE BOOKID = ?`,
      [totals.TOTALITEMS, totals.TOTALQTY, totals.TOTALAMOUNT, userId, bookingId]
    );

    // 7. History logging
    await recordBookingHistory(conn, bookingId, userId, `Updated ${item.ITEMNAME} quantity: ${item.QTY} -> ${qty}`);

    await conn.commit();

    return {
      BOOKITEMID: item.BOOKITEMID,
      BOOKID: bookingId,
      QTY: qty,
      RATE: item.RATE,
      AMOUNT: newAmount,
      STATUSID: item.STATUSID,
      STATUSCODE: item.STATUSCODE,
      TOTALITEMS: totals.TOTALITEMS,
      TOTALQTY: totals.TOTALQTY,
      TOTALAMOUNT: totals.TOTALAMOUNT,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Incrementally cancels an existing booking item (soft-cancel, STATUSID = 33) before BOOKUNTIL.
 * If all items become cancelled, auto-cancels the booking header and clears CMS_PBACTIVE.
 */
export const cancelBookingItemIncremental = async ({
  bookingId,
  itemId,
  cancelReason = null,
  userId,
  customerId,
  ctypeCode,
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Lock and validate booking header
    const [[booking]] = await conn.query(
      `SELECT B.*, ST.STATUSCODE, BT.BOOKTYPECODE
       FROM CMS_BOOKING B
       JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
       JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID = B.BOOKTYPEID
       WHERE B.BOOKID = ? FOR UPDATE`,
      [bookingId]
    );

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (customerId && booking.CUSTOMERID !== customerId) {
      throw new ForbiddenError("You do not have permission to modify this booking");
    }

    if (booking.STATUSCODE !== "CRT") {
      throw new BadRequestError("Booking is not in an editable state");
    }

    // 2. Lock and validate booking item
    const [[item]] = await conn.query(
      `SELECT BI.*, ST.STATUSCODE, DM.BOOKUNTIL, MI.ITEMNAME
       FROM CMS_BOOKITEM BI
       JOIN CMS_STATUS ST ON ST.STATUSID = BI.STATUSID
       JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
       JOIN CMS_MENUITEM MI ON MI.MENUITEMID = BI.MENUITEMID
       WHERE BI.BOOKITEMID = ? AND BI.BOOKID = ? FOR UPDATE`,
      [itemId, bookingId]
    );

    if (!item) {
      throw new NotFoundError("Booking item not found");
    }

    if (item.STATUSCODE !== "CRT") {
      throw new BadRequestError("Item is already cancelled or served");
    }

    // Check BOOKUNTIL cutoff
    if (isPastCutoff(item.BOOKUNTIL)) {
      throw new BadRequestError(`Cancellation window has closed for item: ${item.ITEMNAME}`);
    }

    // 3. Soft-cancel the item (STATUSID = 33 'CAN')
    await conn.query(
      `UPDATE CMS_BOOKITEM
       SET STATUSID = 33, REMARKS = COALESCE(?, REMARKS), UPDATEDAT = CURRENT_TIMESTAMP
       WHERE BOOKITEMID = ?`,
      [cancelReason || "Cancelled by customer", itemId]
    );

    // 4. Release / refund wallet balance for this item
    await adjustBookingWalletLedger(conn, {
      customerId: booking.CUSTOMERID,
      bookingId,
      amountDiff: -Number(item.AMOUNT),
      userId,
      remarks: `Pre-booking item cancelled refund: ${item.ITEMNAME}`,
    });

    // 5. Check remaining active items in booking
    const [[activeTotals]] = await conn.query(
      `SELECT COUNT(*) AS ACTIVECOUNT, COALESCE(SUM(QTY), 0) AS TOTALQTY, COALESCE(SUM(AMOUNT), 0) AS TOTALAMOUNT
       FROM CMS_BOOKITEM
       WHERE BOOKID = ? AND STATUSID = 30`,
      [bookingId]
    );

    let bookingCancelled = false;

    if (Number(activeTotals.ACTIVECOUNT) === 0) {
      // All items have been cancelled -> cancel the whole booking
      bookingCancelled = true;
      await conn.query(
        `UPDATE CMS_BOOKING
         SET STATUSID = 33, TOTALITEMS = 0, TOTALQTY = 0, TOTALAMOUNT = 0,
             CANCELLEDBY = ?, CANCELLEDON = CURRENT_TIMESTAMP,
             REMARKS = COALESCE(?, REMARKS), UPDATEDBY = ?, UPDATEDAT = CURRENT_TIMESTAMP
         WHERE BOOKID = ?`,
        [userId, cancelReason || "All items cancelled", userId, bookingId]
      );

      await conn.query(
        `DELETE FROM CMS_PBACTIVE WHERE BOOKID = ?`,
        [bookingId]
      );
    } else {
      // Update header totals with remaining items
      await conn.query(
        `UPDATE CMS_BOOKING
         SET TOTALITEMS = ?, TOTALQTY = ?, TOTALAMOUNT = ?, UPDATEDBY = ?, UPDATEDAT = CURRENT_TIMESTAMP
         WHERE BOOKID = ?`,
        [activeTotals.ACTIVECOUNT, activeTotals.TOTALQTY, activeTotals.TOTALAMOUNT, userId, bookingId]
      );
    }

    // 6. History logging
    await recordBookingHistory(conn, bookingId, userId, `Cancelled item: ${item.ITEMNAME}`);

    await conn.commit();

    return {
      BOOKITEMID: item.BOOKITEMID,
      BOOKID: bookingId,
      STATUSID: 33,
      STATUSCODE: "CAN",
      BOOKING_CANCELLED: bookingCancelled,
      TOTALITEMS: activeTotals.ACTIVECOUNT,
      TOTALQTY: activeTotals.TOTALQTY,
      TOTALAMOUNT: activeTotals.TOTALAMOUNT,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Fetches published menu items and holidays for a weekly date range.
 */
export const getWeeklyPublishedMenuRaw = async ({ canteenId, startDate, endDate, ctypeCode }) => {
  const menuQuery = `
    SELECT
        DS.CANTEENID,
        C.CANTEENNAME,
        DS.DAYSLOTID,
        S.SERVICEID,
        S.SERVCODE,
        S.SERVNAME,
        DATE_FORMAT(DS.SERVDATE, '%Y-%m-%d') AS SERVDATE,
        DS.STARTTIME,
        DS.ENDTIME,
        DM.DAYMENUID,
        DM.DMENUNO,
        MI.MENUITEMID,
        MI.MENUCODE,
        MI.SHORTNAME,
        MI.ITEMNAME,
        MI.ITEMDESCR,
        DM.ISBASE,
        DM.ISSPECIAL,
        DM.ISPREBOOK,
        DM.ISKIOSK,
        DM.AVAILQTY,
        DM.MAXQTY,
        DM.BOOKUNTIL,
        DM.CANCELUNTIL,
        (
            SELECT IPD.PRICE
            FROM   CMS_ITEMPRICE IP
            JOIN   CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
            JOIN   CMS_STATUS IPST ON IPST.STATUSID = IP.STATUSID
            WHERE  IP.MENUITEMID  = MI.MENUITEMID
              AND  IP.EFFFROM    <= DS.SERVDATE
              AND  IPST.STATUSCODE = 'ACT'
              AND  (IPD.CTYPECODE = ? OR IPD.CTYPECODE = 'VIS')
            ORDER BY 
              IP.EFFFROM DESC,
              CASE WHEN IPD.CTYPECODE = ? THEN 1 ELSE 2 END
            LIMIT 1
        ) AS DISPLAYPRICE
    FROM CMS_DAYMENU DM
    JOIN CMS_DAYSLOT DS  ON DS.DAYSLOTID  = DM.DAYSLOTID
    JOIN CMS_SERVICE S   ON S.SERVICEID   = DS.SERVICEID
    JOIN CMS_CANTEEN C   ON C.CANTEENID   = DS.CANTEENID
    JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
    JOIN CMS_STATUS DS_ST ON DS_ST.STATUSID = DS.STATUSID
    JOIN CMS_STATUS DS_AST ON DS_AST.STATUSID = DS.APPRSTATUSID
    JOIN CMS_STATUS DM_ST ON DM_ST.STATUSID = DM.STATUSID
    JOIN CMS_STATUS S_ST ON S_ST.STATUSID = S.STATUSID
    JOIN CMS_STATUS MI_ST ON MI_ST.STATUSID = MI.STATUSID
    WHERE DS.CANTEENID  = ?
      AND DS.SERVDATE  >= ?
      AND DS.SERVDATE  <= ?
      AND DS_AST.STATUSCODE = 'APR'
      AND DM_ST.STATUSCODE  = 'ACT'
      AND DS_ST.STATUSCODE  = 'ACT'
      AND S_ST.STATUSCODE   = 'ACT'
      AND MI_ST.STATUSCODE  = 'ACT'
      AND DM.ISPREBOOK      = 1
    ORDER BY DS.SERVDATE, DS.STARTTIME, S.SERVNAME, DM.ISBASE DESC, MI.ITEMNAME
  `;

  const holidayQuery = `
    SELECT HOLIDAYID, HOLIDAYNAME, DATE_FORMAT(HOLIDAYDATE, '%Y-%m-%d') AS HOLIDAYDATE, ISRECURRING
    FROM CMS_HOLIDAY
    WHERE STATUSID = 10
      AND (
        (HOLIDAYDATE >= ? AND HOLIDAYDATE <= ?)
        OR ISRECURRING = 1
      )
  `;

  const [[menuRows], [holidayRows]] = await Promise.all([
    pool.query(menuQuery, [ctypeCode || "VIS", ctypeCode || "VIS", canteenId, startDate, endDate]),
    pool.query(holidayQuery, [startDate, endDate]),
  ]);

  return {
    menuItems: menuRows || [],
    holidays: holidayRows || [],
  };
};

/**
 * Fetches existing bookings for a customer in a date range.
 */
export const getExistingBookingsInRange = async ({ customerId, startDate, endDate }) => {
  const [rows] = await pool.query(
    `SELECT B.BOOKID, B.BOOKNO, B.SERVICEID, S.SERVNAME, DATE_FORMAT(B.SERVICEDATE, '%Y-%m-%d') AS SERVICEDATE, B.TOTALITEMS, B.TOTALQTY, B.TOTALAMOUNT, ST.STATUSCODE
     FROM CMS_BOOKING B
     JOIN CMS_SERVICE S ON S.SERVICEID = B.SERVICEID
     JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
     WHERE B.CUSTOMERID = ?
       AND B.SERVICEDATE >= ?
       AND B.SERVICEDATE <= ?
       AND ST.STATUSCODE <> 'CAN'`,
    [customerId, startDate, endDate]
  );
  return rows || [];
};

/**
 * Resolves active bookings by RFID access key hash.
 */
export const getBookingsByRfid = async (rfidHash, serviceId = null) => {
  // 1. Validate the RFID access key to get the customer
  const [keyRows] = await pool.query("CALL CMSVALIDATEACCKEY(?)", [rfidHash]);
  const customer = keyRows[0]?.[0];
  if (!customer?.CUSTOMERID) {
    return [];
  }

  // 2. Fetch active ('CRT') bookings for today
  let query = `
    SELECT B.BOOKID, B.BOOKNO, B.CUSTOMERID, B.SERVICEID, B.SERVICEDATE,
           B.STATUSID, ST.STATUSCODE, B.TOTALITEMS, B.TOTALQTY, B.TOTALAMOUNT
    FROM CMS_BOOKING B
    JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
    WHERE B.CUSTOMERID = ?
      AND B.SERVICEDATE = CURDATE()
      AND ST.STATUSCODE = 'CRT'
  `;
  const params = [customer.CUSTOMERID];

  if (serviceId) {
    query += ` AND B.SERVICEID = ?`;
    params.push(Number(serviceId));
  }

  query += ` ORDER BY B.BOOKID DESC`;

  const [bookings] = await pool.query(query, params);
  return bookings;
};

// ===========================================================================
// CORE SERVICE WORKFLOWS
// ===========================================================================

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
  const activeBooking = await getActiveBookingForContext({
    customerId,
    canteenId,
    serviceId,
    serviceDate,
  });

  return activeBooking;
};

/**
 * Prototyping query for listing bookings with strictly scoped Canteen filtering.
 * Returns customer LOGINID and canteen metadata for operational audit.
 */
async function fetchBookingsWithCanteenFilter({
  PCUSTOMERID = null,
  PSERVICEID = null,
  PSTARTDATE = null,
  PENDDATE = null,
  PSTATUS = null,
  PCANTEENID = null,
}) {
  const [rows] = await pool.query(
    `SELECT 
        B.BOOKID, B.BOOKNO, BT.BOOKTYPECODE, 
        B.CUSTOMERID, C.DISPNAME AS CUSTOMERNAME, CU.LOGINID,
        BK_CAN.CANTEENID, BK_CAN.CANTEENNAME,
        B.SERVICEID, S.SERVNAME, B.SERVICEDATE,
        B.STATUSID, ST.STATUSCODE AS STATUSCODE, B.TOTALITEMS, B.TOTALQTY, B.TOTALAMOUNT
    FROM CMS_BOOKING B
    INNER JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID = B.BOOKTYPEID
    INNER JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
    INNER JOIN CMS_CUSTOMER C ON C.CUSTOMERID = B.CUSTOMERID
    LEFT JOIN CMS_USER CU ON CU.USERID = C.USERID
    INNER JOIN CMS_SERVICE S ON S.SERVICEID = B.SERVICEID
    LEFT JOIN (
        SELECT BI.BOOKID, DS.CANTEENID, C.CANTEENNAME
        FROM CMS_BOOKITEM BI
        JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
        JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
        JOIN CMS_CANTEEN C  ON C.CANTEENID  = DS.CANTEENID
        GROUP BY BI.BOOKID, DS.CANTEENID, C.CANTEENNAME
    ) BK_CAN ON BK_CAN.BOOKID = B.BOOKID
    WHERE (? IS NULL OR B.CUSTOMERID = ?)
      AND (? IS NULL OR B.SERVICEID = ?)
      AND (? IS NULL OR B.SERVICEDATE >= ?)
      AND (? IS NULL OR B.SERVICEDATE <= ?)
      AND (? IS NULL OR ST.STATUSCODE = ?)
      AND (? IS NULL OR BK_CAN.CANTEENID = ?)
    ORDER BY B.SERVICEDATE DESC, B.BOOKNO DESC`,
    [
      PCUSTOMERID, PCUSTOMERID,
      PSERVICEID, PSERVICEID,
      PSTARTDATE, PSTARTDATE,
      PENDDATE, PENDDATE,
      PSTATUS, PSTATUS,
      PCANTEENID, PCANTEENID,
    ]
  );
  return rows || [];
}

export const listBookings = async (filters, user = null) => {
  const finalFilters = { ...filters };
  const hasCanteenRole = (user?.CANTEENROLES || []).length > 0;
  const isSysAdmin = (user?.SYSTEMROLES || []).includes("SYSADM");

  // Only restrict to personal customerId if user is purely a customer (no canteen staff/admin privileges)
  if (!hasCanteenRole && !isSysAdmin && user && user.CUSTOMERID) {
    finalFilters.PCUSTOMERID = user.CUSTOMERID;
  }

  // If user has canteen staff/manager role, enforce/validate canteen access
  if (hasCanteenRole && !isSysAdmin) {
    const userCanteenIds = (user.CANTEENROLES || []).map((r) => Number(r.CANTEENID));
    if (finalFilters.PCANTEENID) {
      if (!userCanteenIds.includes(Number(finalFilters.PCANTEENID))) {
        throw new ForbiddenError("Access denied: You do not have permissions for this canteen");
      }
    } else {
      // Default to their primary / first assigned canteen if not specified
      finalFilters.PCANTEENID = userCanteenIds[0] || null;
    }
  }

  // If pagination is requested for customer booking history
  if (finalFilters.page || finalFilters.pageSize) {
    const customerId = finalFilters.PCUSTOMERID || finalFilters.customerId;
    if (customerId) {
      return await bookingRepository.listBookingHistory({
        customerId,
        startDate: finalFilters.PSTARTDATE || finalFilters.startDate || null,
        endDate: finalFilters.PENDDATE || finalFilters.endDate || null,
        statusCode: finalFilters.PSTATUS || finalFilters.status || null,
        page: finalFilters.page || 1,
        pageSize: finalFilters.pageSize || 10,
      });
    }
  }

  return await fetchBookingsWithCanteenFilter(finalFilters);
};

export const fetchKitchenPrep = async (daySlotId) => {
  return await bookingRepository.getKitchenPrep(daySlotId);
};

export const createBooking = async (data, user) => {
  const customerId = user?.CUSTOMERID || data.PCUSTOMERID;

  // Validate BOOKUNTIL in batch
  if (data.PITEMSJSON && data.PITEMSJSON.length > 0) {
    const dayMenuIds = data.PITEMSJSON.map((item) => item.DAYMENUID).filter(Boolean);
    const menuDetails = await daymenuService.getDayMenusByIds(dayMenuIds);
    for (const menuDetail of menuDetails) {
      if (isPastCutoff(menuDetail.BOOKUNTIL)) {
        throw new BadRequestError(`Booking window has closed for item: ${menuDetail.ITEMNAME}`);
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
  return await addBookingItemIncremental({
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
  return await updateBookingItemQtyIncremental({
    bookingId: Number(bookingId),
    itemId: Number(itemId),
    qty: Number(qty),
    userId: user.USERID,
    customerId: user.CUSTOMERID,
    ctypeCode: user.CTYPECODE,
  });
};

export const updateBookingItemsBatch = async (bookingId, items, user) => {
  const bookingInfo = await bookingRepository.getBooking(bookingId);
  if (!bookingInfo || !bookingInfo.HEADER) {
    throw new NotFoundError("Booking not found");
  }

  if (user && user.CUSTOMERID && bookingInfo.HEADER.CUSTOMERID !== user.CUSTOMERID) {
    throw new ForbiddenError("You do not have permission to modify this booking");
  }

  if (bookingInfo.HEADER.STATUSCODE !== "CRT") {
    throw new BadRequestError("Only active bookings can be edited");
  }

  // If user removes all items, cancel the booking entirely and refund full balance
  if (!items || items.length === 0) {
    await cancelBooking(
      bookingId,
      { PCANCELREASON: "All items removed by user in edit meal planner" },
      user
    );
    return await bookingRepository.getBooking(bookingId);
  }

  const formattedItems = items.map((i) => ({
    DAYMENUID: Number(i.dayMenuId || i.DAYMENUID),
    QTY: Number(i.qty || i.QTY),
  }));

  await bookingRepository.updateBookingItem({
    PBOOKINGID: Number(bookingId),
    PITEMSJSON: formattedItems,
    PCHANGEDBY: user.USERID,
  });

  return await bookingRepository.getBooking(bookingId);
};

export const cancelBookingItem = async (bookingId, itemId, data, user) => {
  return await cancelBookingItemIncremental({
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

  // Check if past cancel cutoff
  const activeItems = (bookingInfo.ITEMS || []).filter(
    (item) => item.STATUSCODE === "CRT" || item.STATUSID === 30
  );

  for (const item of activeItems) {
    const menuDetail = await daymenuService.getDayMenuById(item.DAYMENUID);
    if (menuDetail && isPastCutoff(menuDetail.BOOKUNTIL)) {
      throw new BadRequestError(`Cancellation window has closed for item: ${menuDetail.ITEMNAME}`);
    }
  }

  return await bookingRepository.cancelBooking({
    PBOOKINGID: Number(bookingId),
    ...data,
    PCANCELLEDBY: user.USERID,
  });
};

/**
 * Validates that an operation cannot be performed on a future-dated booking.
 */
const assertNotFutureBooking = async (bookingId, actionDescription) => {
  const booking = await bookingRepository.getBooking(bookingId);
  const servDate = booking?.HEADER?.SERVICEDATE;
  if (!servDate) return;

  const servDateStr =
    typeof servDate === "string"
      ? servDate.slice(0, 10)
      : new Date(servDate).toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (servDateStr > todayStr) {
    throw new BadRequestError(
      `Cannot ${actionDescription} a future booking before its scheduled date (Scheduled: ${servDateStr}, Today: ${todayStr})`
    );
  }
};

export const serveBooking = async (bookingId, data, userId, kioskId = null) => {
  await assertNotFutureBooking(bookingId, "serve");
  return await bookingRepository.serveBooking({
    PBOOKINGID: Number(bookingId),
    ...data,
    PSERVEDBY: userId,
    PKIOSKID: kioskId,
  });
};

export const noShowBooking = async (bookingId, data, userId) => {
  await assertNotFutureBooking(bookingId, "mark as no-show");
  return await bookingRepository.noShowBooking({
    PBOOKINGID: Number(bookingId),
    ...data,
    PCHANGEDBY: userId,
  });
};

export const toggleKiosk = async (dayMenuId, data, userId) => {
  return await bookingRepository.toggleKiosk({
    PDAYMENUID: Number(dayMenuId),
    ...data,
    PCHANGEDBY: userId,
  });
};

export const scanRfid = async (rfidHash, serviceId) => {
  const bookings = await getBookingsByRfid(rfidHash, serviceId);

  if (!bookings || bookings.length === 0) {
    throw new NotFoundError("No active bookings found for this RFID");
  }

  return bookings;
};

export const serveBookingItem = async (bookingId, itemId, data, userId) => {
  await assertNotFutureBooking(bookingId, "serve an item from");
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
  const { menuItems, holidays } = await getWeeklyPublishedMenuRaw({
    canteenId,
    startDate,
    endDate,
    ctypeCode,
  });

  let existingBookings = [];
  if (user?.CUSTOMERID) {
    existingBookings = await getExistingBookingsInRange({
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

  // First, populate closed holidays so even days with no menu rows are represented
  for (const h of holidays) {
    const hDateStr = normalizeDateStr(h.HOLIDAYDATE);
    if (!daysMap[hDateStr]) {
      daysMap[hDateStr] = {
        date: hDateStr,
        isHoliday: true,
        isSpecialHolidayService: false,
        holidayName: h.HOLIDAYNAME,
        services: {},
      };
    }
  }

  for (const item of menuItems) {
    const dateStr = normalizeDateStr(item.SERVDATE);
    const hasHoliday = Boolean(holidayMap[dateStr]);

    if (!daysMap[dateStr]) {
      daysMap[dateStr] = {
        date: dateStr,
        isHoliday: false,
        isSpecialHolidayService: hasHoliday,
        holidayName: holidayMap[dateStr] || null,
        services: {},
      };
    } else if (hasHoliday) {
      // Published menu exists on this holiday -> Manager enabled service!
      daysMap[dateStr].isHoliday = false;
      daysMap[dateStr].isSpecialHolidayService = true;
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

  // Extract distinct services present in the weekly menu
  const serviceMap = new Map();
  for (const item of menuItems) {
    if (!serviceMap.has(item.SERVICEID)) {
      serviceMap.set(item.SERVICEID, {
        SERVICEID: item.SERVICEID,
        SERVCODE: item.SERVCODE,
        SERVNAME: item.SERVNAME,
        STARTTIME: item.STARTTIME,
        ENDTIME: item.ENDTIME,
      });
    }
  }
  const services = Array.from(serviceMap.values());

  return {
    canteenId,
    startDate,
    endDate,
    holidays,
    daysMap,
    existingBookings,
    services,
  };
};
