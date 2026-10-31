import * as KioskRepository from "./kiosk.repository.js";
import * as bookingService from "../booking/booking.service.js";
import * as bookingRepository from "../booking/booking.repository.js";
import { WalkinService } from "../walkin/walkin.service.js";
import { pool } from "../../db/connection.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../common/errors/appError.js";
import { getTodayIST, getTomorrowIST, toMySQLDate } from "../../utils/dateTime.js";

/**
 * Boot handshake: Resolves kiosk identity from client IP
 */
export const getKioskConfig = async (clientIp) => {
  const normalizedIp = clientIp?.startsWith("::ffff:") ? clientIp.substring(7) : clientIp;
  const targetIp = normalizedIp === "::1" ? "127.0.0.1" : normalizedIp;

  try {
    const device = await KioskRepository.identifyKioskDevice(targetIp);

    if (!device) {
      return {
        registered: false,
        ipAddress: targetIp,
        message: "This terminal IP is not registered in the CMS Kiosk Device table.",
      };
    }

    return {
      registered: true,
      kioskId: device.KIOSKID,
      deviceCode: device.DEVICECODE,
      deviceName: device.DEVICENAME,
      ipAddress: device.IPADDRESS,
      canteenId: device.CANTEENID,
      canteenName: device.CANTEENNAME,
      canteenCode: device.CANTEENCODE,
      kioskType: device.KIOSKTYPE, // 'STAFF_COUNTER' | 'EMP_SELF_SERVICE'
      isActive: device.ISACTIVE === 1,
    };
  } catch (err) {
    return {
      registered: false,
      ipAddress: targetIp,
      message: err.message || "Unregistered kiosk terminal",
    };
  }
};

/**
 * Scan RFID at Employee Self-Service Kiosk
 * Returns employee profile, active bookings, and wallet ONLY if contract worker or visitor
 */
export const scanSelfService = async (data) => {
  const loginInfo = await KioskRepository.getLoginInfo(data.PIDENTIFIER);
  if (!loginInfo || !loginInfo.CUSTOMER) {
    throw new NotFoundError(`Employee with ID or RFID card "${data.PIDENTIFIER}" was not found or has no active profile.`);
  }

  const customer = loginInfo.CUSTOMER;
  const customerId = customer.CUSTOMERID;
  const user = loginInfo.USER;

  // Last 10 bookings for kiosk: Active upcoming bookings nearest to current date first
  let upcomingBookings = [];
  try {
    upcomingBookings = await KioskRepository.getKioskCustomerBookings(customerId, 10);
  } catch (err) {
    // Fallback to listBookingsHistory if direct query fails
    try {
      const rawHistory = await KioskRepository.listBookingsHistory(
        customerId,
        null,
        null,
        null,
        1,
        10
      );
      upcomingBookings = rawHistory || [];
    } catch {
      const rawBookings = await KioskRepository.listBookings(
        customerId,
        data.PSERVICEID || null,
        null,
        null,
        data.PCANTEENID || null
      );
      upcomingBookings = (rawBookings || []).slice(0, 10);
    }
  }

  // Ensure active upcoming bookings are strictly sorted nearest to current date first
  const todayStr = getTodayIST();
  upcomingBookings.sort((a, b) => {
    const aDate = a.SERVICEDATE ? String(a.SERVICEDATE).slice(0, 10) : "";
    const bDate = b.SERVICEDATE ? String(b.SERVICEDATE).slice(0, 10) : "";
    const aActive = (a.STATUSCODE === "CRT" || a.STATUSID === 30) && aDate >= todayStr;
    const bActive = (b.STATUSCODE === "CRT" || b.STATUSID === 30) && bDate >= todayStr;

    // Active upcoming bookings come first
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    // If both are active upcoming, nearest date to today comes first (ASC)
    if (aActive && bActive) {
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return Number(a.BOOKID) - Number(b.BOOKID);
    }

    // If both are past / inactive, most recent date comes first (DESC)
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return Number(b.BOOKID) - Number(a.BOOKID);
  });

  // Business Rule: Wallet is displayed ONLY for Contract Employees and Visitors
  const isContractOrVisitor = ["CONTEMP", "CNT", "VIS", "VISITOR"].includes(customer.CTYPECODE);

  let wallet = null;
  if (isContractOrVisitor) {
    const walletRecord = await KioskRepository.getCustomerWallet(customerId);
    wallet = {
      balance: walletRecord ? Number(walletRecord.BALANCE) : 0,
      reserved: walletRecord ? Number(walletRecord.RESERVEDAMT || 0) : 0,
      statusId: walletRecord ? walletRecord.STATUSID : 10,
    };
  }

  return {
    customer: {
      customerId: customer.CUSTOMERID,
      displayName: customer.DISPNAME,
      customerTypeCode: customer.CTYPECODE,
      loginId: customer.LOGINID || user?.LOGINID || "",
      isWalletEligible: isContractOrVisitor,
    },
    wallet,
    upcomingBookings,
  };
};

/**
 * Gets tomorrow's available meal services for self-service kiosk (Breakfast, Lunch, etc.)
 */
export const getNextDayServices = async (canteenId) => {
  const tomorrow = getTomorrowIST();
  const [rows] = await pool.query(
    `SELECT 
        DS.SERVICEID,
        S.SERVCODE,
        S.SERVNAME,
        DS.STARTTIME,
        DS.ENDTIME,
        COUNT(DM.DAYMENUID) AS TOTALITEMS
     FROM CMS_DAYSLOT DS
     JOIN CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
     JOIN CMS_DAYMENU DM ON DM.DAYSLOTID = DS.DAYSLOTID AND DM.ISKIOSK = 1 AND DM.STATUSID = 10
     WHERE DS.CANTEENID = ?
        AND DS.SERVICEDATE = ?
       AND DS.STATUSID = 10
     GROUP BY DS.SERVICEID, S.SERVCODE, S.SERVNAME, DS.STARTTIME, DS.ENDTIME
     ORDER BY DS.STARTTIME ASC`,
    [Number(canteenId), tomorrow]
  );

  return {
    targetDate: tomorrow,
    services: rows.map((r) => ({
      serviceId: r.SERVICEID,
      serviceCode: r.SERVCODE,
      serviceName: r.SERVNAME,
      startTime: r.STARTTIME,
      endTime: r.ENDTIME,
      totalItems: Number(r.TOTALITEMS || 0),
    })),
  };
};

/**
 * Gets next day menu published for a canteen where ISKIOSK = 1 (optionally filtered by serviceId)
 */
export const getNextDayKioskMenu = async (canteenId, serviceDate, serviceId = null) => {
  let query = `SELECT 
        DM.DAYMENUID,
        DM.DAYSLOTID,
        DS.SERVICEID,
        S.SERVNAME,
        DS.STARTTIME,
        DS.ENDTIME,
        DM.MENUITEMID,
        MI.MENUCODE,
        MI.SHORTNAME,
        MI.ITEMNAME,
        MI.DESCR AS ITEMDESC,
        MI.DESCR AS ITEMDESCR,
        COALESCE(
          (SELECT IPD.PRICE 
           FROM CMS_ITEMPRICE IP
           JOIN CMS_ITMPRICDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
           WHERE IP.MENUITEMID = MI.MENUITEMID 
             AND IP.STATUSID = 10 
             AND IP.EFFFROM <= ?
           ORDER BY IP.EFFFROM DESC 
           LIMIT 1),
          0.00
        ) AS RATE,
        DM.BOOKUNTIL,
        DM.CANCELUNTIL,
        DM.AVAILQTY,
        DM.MAXQTY
     FROM CMS_DAYMENU DM
     JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
     JOIN CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
     JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
     WHERE DS.CANTEENID = ?
       AND DS.SERVICEDATE = ?
       AND DM.ISKIOSK = 1
       AND DM.STATUSID = 10`;

  const params = [serviceDate, Number(canteenId), serviceDate];
  if (serviceId) {
    query += ` AND DS.SERVICEID = ?`;
    params.push(Number(serviceId));
  }
  query += ` ORDER BY DS.STARTTIME ASC, MI.ITEMNAME ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

/**
 * Resolves USERID and CUSTOMERID from CMS_CUSTOMER
 */
export const getCustomerUser = async (customerId) => {
  const [rows] = await pool.query(
    "SELECT USERID, CUSTOMERID FROM CMS_CUSTOMER WHERE CUSTOMERID = ? LIMIT 1",
    [customerId]
  );
  return rows[0] || null;
};

/**
 * Retrieves basic booking metadata for validation and authorization
 */
export const getBookingBasic = async (bookingId) => {
  const [rows] = await pool.query(
    "SELECT BOOKID, CUSTOMERID, STATUSID, SERVICEDATE, SERVICEID FROM CMS_BOOKING WHERE BOOKID = ? LIMIT 1",
    [bookingId]
  );
  return rows[0] || null;
};

/**
 * Gets tomorrow's kiosk-enabled menu for self-service pre-booking (optionally for a specific serviceId)
 */
export const getNextDayMenu = async (canteenId, serviceId = null) => {
  const tomorrow = getTomorrowIST();
  const items = await getNextDayKioskMenu(canteenId, tomorrow, serviceId);

  // Group items by meal service
  const serviceMap = new Map();
  for (const item of items) {
    if (!serviceMap.has(item.SERVICEID)) {
      serviceMap.set(item.SERVICEID, {
        serviceId: item.SERVICEID,
        serviceName: item.SERVNAME,
        startTime: item.STARTTIME,
        endTime: item.ENDTIME,
        serviceDate: tomorrow,
        items: [],
      });
    }
    serviceMap.get(item.SERVICEID).items.push({
      dayMenuId: item.DAYMENUID,
      daySlotId: item.DAYSLOTID,
      menuItemId: item.MENUITEMID,
      menuCode: item.MENUCODE,
      shortName: item.SHORTNAME,
      itemName: item.ITEMNAME,
      itemDesc: item.ITEMDESC,
      rate: Number(item.RATE || 0),
      bookUntil: item.BOOKUNTIL,
      cancelUntil: item.CANCELUNTIL,
      availQty: item.AVAILQTY,
      maxQty: item.MAXQTY,
    });
  }

  return {
    targetDate: tomorrow,
    services: Array.from(serviceMap.values()),
  };
};

/**
 * Next-day self-service pre-booking
 */
export const bookNextDay = async (data, kiosk = null) => {
  const today = getTodayIST();
  const serviceDate = toMySQLDate(data.SERVICEDATE);

  // Strict Constraint: Kiosk pre-booking is allowed ONLY for tomorrow or later
  if (serviceDate <= today) {
    throw new BadRequestError(
      "Self-service kiosk bookings are strictly allowed for tomorrow or upcoming days. Same-day bookings cannot be created at this terminal."
    );
  }

  const offlineUuid = data.OFFLINEUUID || data.offlineUuid || null;
  const kioskCode = data.KIOSKCODE || data.kioskCode || kiosk?.deviceCode || "KIOSK";

  // 1. Idempotency Guard: Check if booking with this offlineUuid already exists
  if (offlineUuid) {
    const [existingByUuid] = await pool.query(
      `SELECT B.BOOKID, B.BOOKNO, B.SERVICEID, B.SERVICEDATE, B.TOTALAMOUNT
       FROM CMS_BOOKING B
       WHERE B.REMARKS LIKE CONCAT('%', ?, '%')
       LIMIT 1`,
      [offlineUuid]
    );

    if (existingByUuid.length > 0) {
      const match = existingByUuid[0];
      const [[walletRow]] = await pool.query(
        `SELECT W.BALANCE 
         FROM CMS_WALLET W 
         JOIN CMS_STATUS ST ON ST.STATUSID = W.STATUSID 
         WHERE W.CUSTOMERID = ? AND ST.STATUSCODE = 'ACT' 
         LIMIT 1`,
        [data.CUSTOMERID]
      );

      return {
        bookId: match.BOOKID,
        bookNo: match.BOOKNO,
        serviceId: match.SERVICEID,
        serviceDate: match.SERVICEDATE ? String(match.SERVICEDATE).slice(0, 10) : serviceDate,
        totalAmount: Number(match.TOTALAMOUNT || 0),
        walletBalance: walletRow ? Number(walletRow.BALANCE) : null,
        isOfflineRecord: false,
      };
    }
  }

  // 2. Prevent duplicate bookings: Check if customer already has an active booking for this service & date
  const [existingBookings] = await pool.query(
    `SELECT B.BOOKID, B.BOOKNO 
     FROM CMS_BOOKING B
     JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
     WHERE B.CUSTOMERID = ?
       AND B.SERVICEID = ?
       AND B.SERVICEDATE = ?
       AND ST.STATUSCODE <> 'CAN'
     LIMIT 1`,
    [data.CUSTOMERID, data.SERVICEID, serviceDate]
  );

  if (existingBookings.length > 0) {
    throw new BadRequestError(
      `You already have an active booking (${existingBookings[0].BOOKNO}) for this meal service on ${serviceDate}. Duplicate bookings for the same service are not allowed.`
    );
  }

  const formattedItems = (data.ITEMS || []).map((item) => ({
    DAYMENUID: item.DAYMENUID || item.dayMenuId,
    MENUITEMID: item.MENUITEMID || item.menuItemId,
    QTY: item.QTY || item.qty,
  }));

  // Resolve user id from customer record
  const customerRow = await getCustomerUser(data.CUSTOMERID);
  const userId = customerRow?.USERID || 1; // Fallback to system admin if customer has no user account

  const remarks = offlineUuid
    ? `KIOSK_ONLINE [${kioskCode}:${offlineUuid}]`
    : `Booked via Self-Service Kiosk [${kioskCode}]`;

  const bookingResult = await bookingService.createBooking(
    {
      PBOOKTYPECODE: "KS", // Kiosk Booking type
      PSERVICEID: data.SERVICEID,
      PSERVICEDATE: serviceDate,
      PCUSTOMERID: data.CUSTOMERID,
      PITEMSJSON: formattedItems,
      PKIOSKID: kiosk?.kioskId || null,
      PREMARKS: remarks,
    },
    { USERID: userId, CUSTOMERID: data.CUSTOMERID }
  );

  const createdRow = bookingResult?.[0]?.[0] || bookingResult?.[0] || bookingResult;
  const bookId = createdRow?.BOOKID || createdRow?.bookId;
  let bookNo = createdRow?.BOOKNO || createdRow?.bookNo;
  let totalAmount = 0;

  if (bookId) {
    const [[saved]] = await pool.query(
      `SELECT BOOKID, BOOKNO, TOTALAMOUNT FROM CMS_BOOKING WHERE BOOKID = ?`,
      [bookId]
    );
    if (saved) {
      bookNo = saved.BOOKNO;
      totalAmount = Number(saved.TOTALAMOUNT || 0);
    }
  }

  const [[walletRow]] = await pool.query(
    `SELECT W.BALANCE 
     FROM CMS_WALLET W 
     JOIN CMS_STATUS ST ON ST.STATUSID = W.STATUSID 
     WHERE W.CUSTOMERID = ? AND ST.STATUSCODE = 'ACT' 
     LIMIT 1`,
    [data.CUSTOMERID]
  );

  return {
    bookId,
    bookNo,
    serviceId: data.SERVICEID,
    serviceDate,
    totalAmount,
    walletBalance: walletRow ? Number(walletRow.BALANCE) : null,
    isOfflineRecord: false,
  };
};

/**
 * Retrieves detailed booking information including items for editing at kiosk
 */
export const getKioskBookingDetails = async (bookingId, customerId = null) => {
  const bookingInfo = await bookingRepository.getBooking(Number(bookingId));
  if (!bookingInfo || !bookingInfo.HEADER) {
    throw new NotFoundError("Booking not found");
  }

  if (customerId && Number(bookingInfo.HEADER.CUSTOMERID) !== Number(customerId)) {
    throw new ForbiddenError("You do not have permission to view this booking");
  }

  return {
    booking: bookingInfo.HEADER,
    items: bookingInfo.ITEMS || [],
  };
};

/**
 * Updates an active booking from Self-Service Kiosk before cutoff
 */
export const updateKioskBooking = async (data, kiosk = null) => {
  const bookingId = Number(data.BOOKINGID);
  const customerId = Number(data.CUSTOMERID);

  const booking = await getBookingBasic(bookingId);
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }
  if (booking.CUSTOMERID !== customerId) {
    throw new ForbiddenError("You do not have permission to modify this booking");
  }
  if (booking.STATUSID !== 30) {
    throw new BadRequestError("Only active/created bookings (CRT) can be edited");
  }

  // Resolve user id from customer record
  const customerRow = await getCustomerUser(customerId);
  const userId = customerRow?.USERID || 1;

  const formattedItems = (data.ITEMS || []).map((item) => ({
    DAYMENUID: Number(item.DAYMENUID || item.dayMenuId),
    QTY: Number(item.QTY || item.qty),
  }));

  const result = await bookingRepository.updateBookingItem({
    PBOOKINGID: bookingId,
    PITEMSJSON: formattedItems,
    PCHANGEDBY: userId,
  });

  return result;
};

/**
 * Cancel active booking from Self-Service Kiosk
 */
export const cancelKioskBooking = async (data, kiosk = null) => {
  const bookingId = Number(data.BOOKINGID);
  const customerId = Number(data.CUSTOMERID);

  // Verify booking belongs to this customer and is still active
  const booking = await getBookingBasic(bookingId);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }
  if (booking.CUSTOMERID !== customerId) {
    throw new ForbiddenError("You do not have permission to cancel this booking");
  }
  if (booking.STATUSID !== 30) {
    throw new BadRequestError("Only active/created bookings (CRT) can be cancelled");
  }

  // Resolve user id for audit tracking
  const customerRow = await getCustomerUser(customerId);
  const userId = customerRow?.USERID || 1;

  const result = await KioskRepository.cancelBooking(
    bookingId,
    userId,
    data.CANCELREASON || `Cancelled at Kiosk [${kiosk?.deviceCode || "Self-Service"}]`
  );

  return result;
};

/**
 * Cancels active booking at serving counter by staff with attribution and automatic refund
 */
export const cancelCounterBooking = async (bookingId, userId, reason = "Cancelled at Serving Counter") => {
  const booking = await getBookingBasic(Number(bookingId));
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }
  if (booking.STATUSID === 32) {
    throw new BadRequestError("Cannot cancel an already served booking");
  }
  if (booking.STATUSID === 33) {
    throw new BadRequestError("Booking is already cancelled");
  }

  return await KioskRepository.cancelBooking(Number(bookingId), Number(userId), reason);
};


/**
 * Record heartbeat
 */
export const recordHeartbeat = async (kioskId, clientIp) => {
  return await KioskRepository.recordHeartbeat(kioskId, clientIp);
};

/**
 * Gets currently active or next upcoming meal slot for a kiosk terminal
 */
export const getCurrentSlot = async (canteenId = null, kioskId = null) => {
  return await KioskRepository.getCurrentSlot(canteenId, kioskId);
};

/**
 * Resolves a booking for serving counter with meal slot and time-window awareness
 */
export const resolveServingBooking = async (identifier, canteenId = null, kioskId = null, daySlotId = null) => {
  const booking = await KioskRepository.resolveKioskBooking(identifier, canteenId, kioskId, daySlotId);
  if (!booking) {
    throw new NotFoundError("No active booking found for this identifier in this canteen facility");
  }
  return booking;
};

/**
 * Marks a booking as served from the kiosk terminal with operator attribution
 */
export const serveBooking = async (bookingId, userId, kioskId = null) => {
  const booking = await bookingService.getBooking(bookingId);
  const servDate = booking?.HEADER?.SERVICEDATE;
  if (servDate) {
    const servDateStr =
      typeof servDate === "string"
        ? servDate.slice(0, 10)
        : new Date(servDate).toISOString().slice(0, 10);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (servDateStr > todayStr) {
      throw new BadRequestError(
        `Cannot serve a future booking before its scheduled date (Scheduled: ${servDateStr}, Today: ${todayStr})`
      );
    }
  }

  return await KioskRepository.serveKioskBooking(bookingId, userId, kioskId);
};

/**
 * Retrieves all active canteens
 */
export const getActiveCanteens = async () => {
  const [rows] = await pool.query(
    "SELECT CANTEENID, CANTEENCODE, CANTEENNAME, LOCATION FROM CMS_CANTEEN WHERE STATUSID = 10 ORDER BY CANTEENID ASC"
  );
  return rows;
};

/**
 * Retrieves all meal slots scheduled for today at a canteen
 */
export const getTodaySlots = async (canteenId) => {
  const [rows] = await pool.query(
    `SELECT 
        DS.DAYSLOTID,
        DS.SLOTNO,
        DS.SERVICEID,
        S.SERVCODE,
        S.SERVNAME,
        DS.CANTEENID,
        DS.SERVICEDATE AS SERVDATE,
        DS.SERVICEDATE,
        DS.STARTTIME,
        DS.ENDTIME,
        DS.STATUSID,
        (CASE 
          WHEN CURRENT_TIME() BETWEEN (DS.STARTTIME - INTERVAL 15 MINUTE) AND (DS.ENDTIME + INTERVAL 15 MINUTE) THEN 1 
          ELSE 0 
        END) AS ISCURRENT
     FROM CMS_DAYSLOT DS
     JOIN CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
     WHERE DS.CANTEENID = ?
       AND DS.SERVICEDATE = CURDATE()
       AND DS.STATUSID = 10
     ORDER BY DS.STARTTIME ASC`,
    [Number(canteenId)]
  );
  return rows;
};

/**
 * Master data bootstrap package snapshot for offline kiosk terminals
 */
export const getBootstrapPackage = async (canteenId = 1, since = null) => {
  const effectiveCanteenId = Number(canteenId) || 1;
  const today = getTodayIST();

  // 0. Compute maximum modification timestamp across relevant master tables
  const [changeRows] = await pool.query(
    `SELECT GREATEST(
      COALESCE((SELECT MAX(COALESCE(UPDATEDAT, CREATEDAT)) FROM CMS_CUSTOMER WHERE STATUSID = 10), '1970-01-01 00:00:00'),
      COALESCE((SELECT MAX(COALESCE(UPDATEDAT, CREATEDAT)) FROM CMS_DAYMENU WHERE STATUSID = 10), '1970-01-01 00:00:00'),
      COALESCE((SELECT MAX(COALESCE(UPDATEDAT, CREATEDAT)) FROM CMS_DAYSLOT WHERE STATUSID = 10 AND CANTEENID = ?), '1970-01-01 00:00:00'),
      COALESCE((SELECT MAX(COALESCE(UPDATEDAT, CREATEDAT)) FROM CMS_ACCKEY WHERE STATUSID = 10), '1970-01-01 00:00:00')
    ) AS LAST_CHANGE`,
    [effectiveCanteenId]
  );

  const rawLastChange = changeRows[0]?.LAST_CHANGE;
  const lastChangeDate = rawLastChange ? new Date(rawLastChange) : null;
  const lastModifiedIso = lastChangeDate && !isNaN(lastChangeDate.getTime()) 
    ? lastChangeDate.toISOString() 
    : new Date().toISOString();

  // If client provided 'since' and master data has not changed since then, return 304 Not Modified
  if (since && lastChangeDate && !isNaN(lastChangeDate.getTime())) {
    const sinceDate = new Date(since);
    if (!isNaN(sinceDate.getTime()) && lastChangeDate.getTime() <= sinceDate.getTime()) {
      return {
        notModified: true,
        lastModified: lastModifiedIso,
      };
    }
  }

  // 1. Customers: active customers with RFID key or Login ID and real employee mapping
  const [customers] = await pool.query(
    `SELECT 
        c.CUSTOMERID AS customerId,
        COALESCE(ak.KEYVALUE, '') AS rfidUid,
        COALESCE(pe.EMPCODE, ce.CONTCODE, oe.EMPCODE, u.LOGINID, CAST(c.CUSTOMERID AS CHAR)) AS loginId,
        c.DISPNAME AS dispName,
        ct.CTYPECODE AS ctypeCode,
        ct.CTYPENAME AS ctypeName
     FROM CMS_CUSTOMER c
     JOIN CMS_CUSTTYPE ct ON ct.CTYPEID = c.CTYPEID
     LEFT JOIN CMS_USER u ON u.USERID = c.USERID
     LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
     LEFT JOIN CMS_CONTEMP ce ON ce.CUSTOMERID = c.CUSTOMERID
     LEFT JOIN CMS_OCEEMP oe ON oe.CUSTOMERID = c.CUSTOMERID
     LEFT JOIN CMS_ACCKEY ak ON ak.CUSTOMERID = c.CUSTOMERID AND ak.STATUSID = 10
     WHERE c.STATUSID = 10`
  );

  // 2. Wallets for contract workers / visitors
  const [wallets] = await pool.query(
    `SELECT 
        w.CUSTOMERID AS customerId,
        w.BALANCE AS balance,
        w.STATUSID AS statusId
     FROM CMS_WALLET w
     JOIN CMS_CUSTOMER c ON c.CUSTOMERID = w.CUSTOMERID
     WHERE w.STATUSID = 10`
  );

  // 3. Day Slots strictly for upcoming dates (SERVICEDATE > CURDATE())
  const [daySlots] = await pool.query(
    `SELECT 
        DS.DAYSLOTID AS daySlotId,
        DS.CANTEENID AS canteenId,
        DS.SERVICEID AS serviceId,
        S.SERVNAME AS serviceName,
        DATE_FORMAT(DS.SERVICEDATE, '%Y-%m-%d') AS servDate,
        DS.STARTTIME AS startTime,
        DS.ENDTIME AS endTime
     FROM CMS_DAYSLOT DS
     JOIN CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
     WHERE DS.CANTEENID = ?
       AND DS.SERVICEDATE > ?
       AND DS.STATUSID = 10
     ORDER BY DS.SERVICEDATE ASC, DS.STARTTIME ASC`,
    [effectiveCanteenId, today]
  );

  // 4. Kiosk-enabled Menu Items for upcoming slots
  const [menuItems] = await pool.query(
    `SELECT 
        DM.DAYMENUID AS dayMenuId,
        DM.DAYSLOTID AS daySlotId,
        DM.MENUITEMID AS menuItemId,
        MI.ITEMNAME AS itemName,
        COALESCE(
          (SELECT IPD.PRICE 
           FROM CMS_ITEMPRICE IP
           JOIN CMS_ITMPRICDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
           WHERE IP.MENUITEMID = MI.MENUITEMID 
             AND IP.STATUSID = 10 
             AND IP.EFFFROM <= DS.SERVICEDATE
           ORDER BY IP.EFFFROM DESC 
           LIMIT 1),
          0.00
        ) AS rate,
        DM.ISBASE AS isBase,
        DM.ISSPECIAL AS isSpecial,
        DM.MAXQTY AS maxQty,
        DM.BOOKUNTIL AS bookUntil
     FROM CMS_DAYMENU DM
     JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
     JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
     WHERE DS.CANTEENID = ?
       AND DS.SERVICEDATE > ?
       AND DS.STATUSID = 10
       AND DM.ISKIOSK = 1
       AND DM.STATUSID = 10`,
    [effectiveCanteenId, today]
  );
  // 5. Active upcoming pre-bookings for tomorrow onwards at this canteen
  const [activeBookings] = await pool.query(
    `SELECT 
        B.CUSTOMERID AS customerId,
        B.SERVICEID AS serviceId,
        DATE_FORMAT(B.SERVICEDATE, '%Y-%m-%d') AS servDate,
        B.BOOKID AS bookId,
        B.BOOKNO AS tokenNo
     FROM CMS_BOOKING B
     JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
     JOIN CMS_DAYSLOT DS ON DS.SERVICEID = B.SERVICEID AND DS.SERVICEDATE = B.SERVICEDATE AND DS.CANTEENID = ?
     WHERE B.SERVICEDATE > ?
       AND ST.STATUSCODE <> 'CAN'
       AND B.STATUSID = 10`,
    [effectiveCanteenId, today]
  );

  // 6. Serving Manifest for Today strictly for this canteen (for offline counter operations)
  const [todayBookings] = await pool.query(
    `SELECT 
        B.BOOKID AS bookId,
        B.BOOKNO AS bookNo,
        B.CUSTOMERID AS customerId,
        COALESCE(PE.EMPCODE, CE.CONTCODE, OE.EMPCODE, U.LOGINID, CAST(B.CUSTOMERID AS CHAR)) AS loginId,
        COALESCE((SELECT AK.KEYVALUE FROM CMS_ACCKEY AK WHERE AK.CUSTOMERID = C.CUSTOMERID AND AK.STATUSID = 10 ORDER BY AK.ACCKEYID DESC LIMIT 1), '') AS rfidUid,
        C.DISPNAME AS dispName,
        CT.CTYPECODE AS ctypeCode,
        B.SERVICEID AS serviceId,
        DS.DAYSLOTID AS daySlotId,
        S.SERVNAME AS slotName,
        ST.STATUSCODE AS statusCode,
        B.SERVEDBY AS servedBy,
        B.SERVEDAT AS servedOn,
        B.TOTALAMOUNT AS totalAmount
     FROM CMS_BOOKING B
     JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
     JOIN CMS_CUSTOMER C ON C.CUSTOMERID = B.CUSTOMERID
     JOIN CMS_CUSTTYPE CT ON CT.CTYPEID = C.CTYPEID
     LEFT JOIN CMS_USER U ON U.USERID = C.USERID
     LEFT JOIN CMS_PERMEMP PE ON PE.CUSTOMERID = C.CUSTOMERID
     LEFT JOIN CMS_CONTEMP CE ON CE.CUSTOMERID = C.CUSTOMERID
     LEFT JOIN CMS_OCEEMP OE ON OE.CUSTOMERID = C.CUSTOMERID
     JOIN CMS_DAYSLOT DS ON DS.SERVICEID = B.SERVICEID AND DS.SERVICEDATE = B.SERVICEDATE AND DS.CANTEENID = ?
     JOIN CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
     WHERE B.SERVICEDATE = ?
       AND ST.STATUSCODE IN ('CRT', 'SRV')
     ORDER BY B.BOOKID DESC`,
    [effectiveCanteenId, today]
  );

  const [todayBookItems] = await pool.query(
    `SELECT 
        BI.BOOKITEMID AS bookItemId,
        BI.BOOKID AS bookId,
        BI.MENUITEMID AS menuItemId,
        MI.ITEMNAME AS itemName,
        BI.QTY AS qty,
        BI.RATE AS rate
     FROM CMS_BOOKITEM BI
     JOIN CMS_BOOKING B ON B.BOOKID = BI.BOOKID
     JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
     JOIN CMS_MENUITEM MI ON MI.MENUITEMID = BI.MENUITEMID
     JOIN CMS_DAYSLOT DS ON DS.SERVICEID = B.SERVICEID AND DS.SERVICEDATE = B.SERVICEDATE AND DS.CANTEENID = ?
     WHERE B.SERVICEDATE = ?
       AND ST.STATUSCODE IN ('CRT', 'SRV')`,
    [effectiveCanteenId, today]
  );

  return {
    notModified: false,
    lastModified: lastModifiedIso,
    canteenId: effectiveCanteenId,
    syncedAt: new Date().toISOString(),
    customers,
    wallets,
    daySlots,
    menuItems,
    activeBookings,
    todayBookings,
    todayBookItems,
  };
};

/**
 * Ingests a batch of offline pre-bookings enqueued by a kiosk outbox
 */
export const syncOfflineBatch = async ({ kioskCode, batchId, items = [] }, kiosk = null) => {
  const results = [];

  for (const item of items) {
    const {
      offlineUuid,
      tokenNo,
      customerId,
      serviceId,
      servDate,
      items: orderItems,
      totalAmount,
      paymentMethod,
    } = item;

    try {
      // 1. Primary Idempotency Check: check if offlineUuid was already recorded in REMARKS
      let existingBooking = null;
      if (offlineUuid) {
        const [byUuid] = await pool.query(
          `SELECT B.BOOKID, B.BOOKNO 
           FROM CMS_BOOKING B
           WHERE B.REMARKS LIKE CONCAT('%', ?, '%')
           LIMIT 1`,
          [offlineUuid]
        );
        if (byUuid.length > 0) {
          existingBooking = byUuid[0];
        }
      }

      // Secondary check: check if already booked for this customer + service + date
      if (!existingBooking) {
        const [byCust] = await pool.query(
          `SELECT B.BOOKID, B.BOOKNO 
           FROM CMS_BOOKING B
           JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
           WHERE B.CUSTOMERID = ? 
             AND B.SERVICEID = ? 
             AND B.SERVICEDATE = ? 
             AND ST.STATUSCODE <> 'CAN'
           LIMIT 1`,
          [customerId, serviceId, toMySQLDate(servDate)]
        );
        if (byCust.length > 0) {
          existingBooking = byCust[0];
        }
      }

      if (existingBooking) {
        results.push({
          offlineUuid,
          status: "SYNCED",
          bookId: existingBooking.BOOKID,
          bookNo: existingBooking.BOOKNO,
          message: "Already processed previously (Idempotent)",
        });
        continue;
      }

      // 2. Format items for booking creation
      const formattedItems = (orderItems || []).map((i) => ({
        DAYMENUID: i.dayMenuId || i.DAYMENUID,
        MENUITEMID: i.menuItemId || i.MENUITEMID,
        QTY: i.quantity || i.qty || i.QTY || 1,
      }));

      const customerRow = await getCustomerUser(customerId);
      const userId = customerRow?.USERID || 1;

      const created = await bookingService.createBooking(
        {
          PBOOKTYPECODE: "KS",
          PSERVICEID: serviceId,
          PSERVICEDATE: toMySQLDate(servDate),
          PCUSTOMERID: customerId,
          PITEMSJSON: formattedItems,
          PKIOSKID: kiosk?.kioskId || null,
          PREMARKS: `OFFLINE_SYNC [${kioskCode || "K1"}:${offlineUuid || ""}]`,
        },
        { USERID: userId, CUSTOMERID: customerId }
      );

      results.push({
        offlineUuid,
        status: "SYNCED",
        bookId: created.BOOKID,
        bookNo: created.BOOKNO,
        message: "Offline booking synchronized successfully",
      });
    } catch (err) {
      results.push({
        offlineUuid,
        status: "REJECTED",
        errorCode: err.code || "SYNC_ERROR",
        message: err.message || "Failed to sync offline booking",
      });
    }
  }

  return { results };
};

/**
 * Ingests a batch of offline serving events (SERVE and WALKIN_SERVE) from a kiosk outbox
 */
export const syncServingEventsBatch = async ({ kioskCode, batchId, events = [] }, kiosk = null) => {
  const results = [];

  for (const event of events) {
    const { eventUuid, eventType, payload = {} } = event;

    try {
      if (eventType === "SERVE") {
        const { bookingId, kioskId, servedBy, servedOn } = payload;
        const effectiveKioskId = kioskId || kiosk?.kioskId || null;
        const effectiveUserId = servedBy || 1;

        // Check if booking is already marked as served in central
        const [existing] = await pool.query(
          `SELECT B.BOOKID, ST.STATUSCODE 
           FROM CMS_BOOKING B
           JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
           WHERE B.BOOKID = ?
           LIMIT 1`,
          [bookingId]
        );

        if (existing.length > 0 && existing[0].STATUSCODE === "SRV") {
          results.push({
            eventUuid,
            status: "SYNCED",
            message: "Booking already marked as served (Idempotent)",
          });
          continue;
        }

        if (existing.length === 0) {
          results.push({
            eventUuid,
            status: "REJECTED",
            message: `Booking #${bookingId} not found in central database`,
          });
          continue;
        }

        // Call standard kiosk serve procedure
        await KioskRepository.serveKioskBooking(bookingId, effectiveUserId, effectiveKioskId);

        results.push({
          eventUuid,
          status: "SYNCED",
          message: "Serving event synchronized successfully",
        });
      } else if (eventType === "WALKIN_SERVE") {
        const { offlineUuid, customerId, canteenId, serviceId, items = [], staffUserId } = payload;
        const targetUuid = offlineUuid || eventUuid;

        // Idempotency check via REMARKS
        const [existingWalkin] = await pool.query(
          `SELECT BOOKID, BOOKNO FROM CMS_BOOKING WHERE REMARKS LIKE CONCAT('%', ?, '%') LIMIT 1`,
          [targetUuid]
        );

        if (existingWalkin.length > 0) {
          results.push({
            eventUuid,
            status: "SYNCED",
            bookId: existingWalkin[0].BOOKID,
            bookNo: existingWalkin[0].BOOKNO,
            message: "Walk-in already processed (Idempotent)",
          });
          continue;
        }

        const effectiveUserId = staffUserId || 1;
        const result = await WalkinService.serveWalkin(
          {
            customerId: Number(customerId),
            canteenId: Number(canteenId || kiosk?.canteenId || 1),
            serviceId: Number(serviceId),
            items: items.map((i) => ({
              dayMenuId: Number(i.dayMenuId),
              qty: Number(i.qty || 1),
            })),
            remarks: `OFFLINE_WALKIN [${kioskCode || "K1"}:${targetUuid}]`,
          },
          effectiveUserId
        );

        results.push({
          eventUuid,
          status: "SYNCED",
          bookId: result.bookId,
          bookNo: result.bookNo,
          message: "Walk-in serving synchronized successfully",
        });
      } else {
        results.push({
          eventUuid,
          status: "REJECTED",
          message: `Unknown event type: ${eventType}`,
        });
      }
    } catch (err) {
      results.push({
        eventUuid,
        status: "REJECTED",
        errorCode: err.code || "SYNC_ERROR",
        message: err.message || "Failed to process serving event",
      });
    }
  }

  return { results };
};

// ============================================================
// Hardware Kiosk Fleet Management (SYSADM)
// ============================================================

export const listKioskDevices = async (canteenId = null) => {
  const devices = await KioskRepository.listKioskDevices(canteenId || null);
  return devices;
};

export const registerKioskDevice = async (deviceData, userId) => {
  const result = await KioskRepository.registerKioskDevice({
    ...deviceData,
    USERID: userId,
  });
  return result;
};

export const getKioskDeviceDetails = async (kioskId) => {
  const devices = await KioskRepository.listKioskDevices(null);
  const found = devices.find((d) => Number(d.KIOSKID) === Number(kioskId));
  if (!found) {
    throw new NotFoundError(`Kiosk device with ID ${kioskId} not found`);
  }
  return found;
};

export const updateKioskDeviceStatus = async (kioskId, statusId, userId) => {
  // to be converted to stored procedure later
  const [result] = await pool.query(
    `UPDATE CMS_KIOSK SET STATUSID = ?, UPDATEDBY = ?, UPDATEDAT = CURRENT_TIMESTAMP WHERE KIOSKID = ?`,
    [statusId, userId, kioskId]
  );
  if (result.affectedRows === 0) {
    throw new NotFoundError(`Kiosk device with ID ${kioskId} not found`);
  }
  return getKioskDeviceDetails(kioskId);
};

export const getKioskFleetTelemetry = async () => {
  const devices = await KioskRepository.listKioskDevices(null);
  const now = Date.now();

  let onlineCount = 0;
  let staleCount = 0;
  let offlineCount = 0;

  const enriched = devices.map((d) => {
    let health = "OFFLINE";
    if (d.LASTHEARTBEATAT) {
      const diffMs = now - new Date(d.LASTHEARTBEATAT).getTime();
      const diffMins = diffMs / (1000 * 60);
      if (diffMins <= 5) {
        health = "ONLINE";
        onlineCount++;
      } else if (diffMins <= 30) {
        health = "STALE";
        staleCount++;
      } else {
        health = "OFFLINE";
        offlineCount++;
      }
    } else {
      offlineCount++;
    }

    return {
      ...d,
      HEALTH_STATUS: health,
    };
  });

  return {
    TOTAL_DEVICES: devices.length,
    ONLINE: onlineCount,
    STALE: staleCount,
    OFFLINE: offlineCount,
    DEVICES: enriched,
  };
};



