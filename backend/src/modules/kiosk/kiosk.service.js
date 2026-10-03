import * as KioskRepository from "./kiosk.repository.js";
import * as bookingService from "../booking/booking.service.js";
import * as bookingRepository from "../booking/booking.repository.js";
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
       AND DS.SERVDATE = ?
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
        MI.ITEMDESCR AS ITEMDESC,
        COALESCE(
          (SELECT IPD.PRICE 
           FROM CMS_ITEMPRICE IP
           JOIN CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
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
       AND DS.SERVDATE = ?
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

  // Prevent duplicate bookings: Check if customer already has an active booking for this service & date
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
    DAYMENUID: item.DAYMENUID,
    MENUITEMID: item.MENUITEMID,
    QTY: item.QTY,
  }));

  // Resolve user id from customer record
  const customerRow = await getCustomerUser(data.CUSTOMERID);
  const userId = customerRow?.USERID || 1; // Fallback to system admin if customer has no user account

  const bookingResult = await bookingService.createBooking(
    {
      PBOOKTYPECODE: "KS", // Kiosk Booking type
      PSERVICEID: data.SERVICEID,
      PSERVICEDATE: serviceDate,
      PCUSTOMERID: data.CUSTOMERID,
      PITEMSJSON: formattedItems,
      PKIOSKID: kiosk?.kioskId || null,
      PREMARKS: `Booked via Self-Service Kiosk [${kiosk?.deviceCode || "UNKNOWN"}]`,
    },
    { USERID: userId, CUSTOMERID: data.CUSTOMERID }
  );

  return bookingResult;
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
        DS.SERVDATE,
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
       AND DS.SERVDATE = CURDATE()
       AND DS.STATUSID = 10
     ORDER BY DS.STARTTIME ASC`,
    [Number(canteenId)]
  );
  return rows;
};


