import { pool } from "../../db/connection.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/appError.js";

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

export const getWeeklyPublishedMenu = async ({ canteenId, startDate, endDate, ctypeCode }) => {
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
      PCHANGEDBY
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
  try {
    const [result] = await pool.query(
      "CALL CMSSERVEBOOK(?, ?, ?)",
      [PBOOKINGID, PSERVEDBY, PKIOSKID]
    );
    return result;
  } catch (err) {
    if (err.code === "ER_WRONG_PARAMCOUNT_TO_PROCEDURE") {
      const [result] = await pool.query(
        "CALL CMSSERVEBOOK(?, ?)",
        [PBOOKINGID, PSERVEDBY]
      );
      return result;
    }
    throw err;
  }
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

// ---------------------------------------------------------------------------
// RAW SQL REPOSITORY OPERATIONS (Pre-Stored Procedure Stage)
// ---------------------------------------------------------------------------

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

    const dmDateStr = typeof dayMenu.SERVDATE === "string" ? dayMenu.SERVDATE.slice(0, 10) : dayMenu.SERVDATE.toISOString().split("T")[0];
    const bkDateStr = typeof booking.SERVICEDATE === "string" ? booking.SERVICEDATE.slice(0, 10) : booking.SERVICEDATE.toISOString().split("T")[0];
    if (dayMenu.SERVICEID !== booking.SERVICEID || dmDateStr !== bkDateStr) {
      throw new BadRequestError("Item does not match the service and date of this booking");
    }

    // Check BOOKUNTIL cutoff
    const now = new Date();
    if (now > new Date(dayMenu.BOOKUNTIL)) {
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

    // 6. Handle wallet reservations for CNT / VIS
    if (["CNT", "VIS", "CONTEMP", "VISITOR"].includes(ctypeCode)) {
      const [[wallet]] = await conn.query(
        `SELECT W.WALLETID, W.BALANCE, W.RESERVEDAMT
         FROM CMS_WALLET W
         JOIN CMS_STATUS W_ST ON W_ST.STATUSID = W.STATUSID
         WHERE W.CUSTOMERID = ? AND W_ST.STATUSCODE = 'ACT'
         FOR UPDATE`,
        [booking.CUSTOMERID]
      );

      if (!wallet) {
        throw new BadRequestError("Active wallet not found for customer");
      }

      const availableBal = Number(wallet.BALANCE) - Number(wallet.RESERVEDAMT);
      if (amount > availableBal) {
        throw new BadRequestError("Insufficient available wallet balance to add item");
      }

      await conn.query(
        `UPDATE CMS_WALLET SET RESERVEDAMT = RESERVEDAMT + ? WHERE WALLETID = ?`,
        [amount, wallet.WALLETID]
      );
    }

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
    const now = new Date();
    if (now > new Date(item.BOOKUNTIL)) {
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

    // 4. Handle wallet reservation adjustment
    if (["CNT", "VIS", "CONTEMP", "VISITOR"].includes(ctypeCode)) {
      const [[wallet]] = await conn.query(
        `SELECT W.WALLETID, W.BALANCE, W.RESERVEDAMT
         FROM CMS_WALLET W
         JOIN CMS_STATUS W_ST ON W_ST.STATUSID = W.STATUSID
         WHERE W.CUSTOMERID = ? AND W_ST.STATUSCODE = 'ACT'
         FOR UPDATE`,
        [booking.CUSTOMERID]
      );

      if (wallet) {
        if (amountDiff > 0) {
          const availableBal = Number(wallet.BALANCE) - Number(wallet.RESERVEDAMT);
          if (amountDiff > availableBal) {
            throw new BadRequestError("Insufficient available wallet balance for quantity increase");
          }
        }

        await conn.query(
          `UPDATE CMS_WALLET SET RESERVEDAMT = RESERVEDAMT + ? WHERE WALLETID = ?`,
          [amountDiff, wallet.WALLETID]
        );
      }
    }

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
    const now = new Date();
    if (now > new Date(item.BOOKUNTIL)) {
      throw new BadRequestError(`Cancellation window has closed for item: ${item.ITEMNAME}`);
    }

    // 3. Soft-cancel the item (STATUSID = 33 'CAN')
    await conn.query(
      `UPDATE CMS_BOOKITEM
       SET STATUSID = 33, REMARKS = COALESCE(?, REMARKS), UPDATEDAT = CURRENT_TIMESTAMP
       WHERE BOOKITEMID = ?`,
      [cancelReason || "Cancelled by customer", itemId]
    );

    // 4. Release wallet reservation for this item
    if (["CNT", "VIS", "CONTEMP", "VISITOR"].includes(ctypeCode)) {
      const [[wallet]] = await conn.query(
        `SELECT W.WALLETID, W.BALANCE, W.RESERVEDAMT
         FROM CMS_WALLET W
         JOIN CMS_STATUS W_ST ON W_ST.STATUSID = W.STATUSID
         WHERE W.CUSTOMERID = ? AND W_ST.STATUSCODE = 'ACT'
         FOR UPDATE`,
        [booking.CUSTOMERID]
      );

      if (wallet) {
        await conn.query(
          `UPDATE CMS_WALLET SET RESERVEDAMT = GREATEST(0, RESERVEDAMT - ?) WHERE WALLETID = ?`,
          [Number(item.AMOUNT), wallet.WALLETID]
        );
      }
    }

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
 * Resolves an active booking for serving by Employee LoginID, RFID Access Key, or Booking Number.
 * Prefers slot-aware CMSKIOSKRESOLVEBOOKING with fallback to CMSGETBOOKFORSERVING.
 */
export const resolveBookingByIdentifier = async (identifier, canteenId = null, serviceId = null, kioskId = null, daySlotId = null) => {
  const trimmed = (identifier || "").trim();
  const isBookNo = trimmed.toUpperCase().startsWith("PB") || trimmed.toUpperCase().startsWith("BK");
  let results;
  try {
    [results] = await pool.query(
      "CALL CMSKIOSKRESOLVEBOOKING(?, ?, ?, ?)",
      [
        trimmed,
        canteenId ? Number(canteenId) : null,
        kioskId ? Number(kioskId) : null,
        daySlotId ? Number(daySlotId) : null,
      ]
    );
  } catch (err) {
    if (err.code === "ER_SP_DOES_NOT_EXIST") {
      try {
        [results] = await pool.query(
          "CALL CMSGETBOOKFORSERVING(?, ?, ?, ?)",
          [
            isBookNo ? null : trimmed,
            isBookNo ? trimmed : null,
            canteenId ? Number(canteenId) : null,
            serviceId ? Number(serviceId) : null,
          ]
        );
      } catch (err2) {
        if (err2.code === "ER_WRONG_PARAMCOUNT_TO_PROCEDURE") {
          [results] = await pool.query(
            "CALL CMSGETBOOKFORSERVING(?, ?)",
            [isBookNo ? null : trimmed, isBookNo ? trimmed : null]
          );
        } else {
          throw err2;
        }
      }
    } else {
      throw err;
    }
  }

  if (!results || results.length < 2 || !results[0] || results[0].length === 0) {
    return null;
  }

  return {
    HEADER: results[0][0],
    ITEMS: results[1] || [],
  };
};

