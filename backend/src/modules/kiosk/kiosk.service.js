import * as KioskRepository from "./kiosk.repository.js";
import * as bookingService from "../booking/booking.service.js";
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

  // Active bookings: Today and future
  const today = getTodayIST();
  const rawBookings = await KioskRepository.listBookings(customerId, data.PSERVICEID, today, null);
  
  // Filter for active/pending bookings (CRT = 30)
  const upcomingBookings = (rawBookings || []).filter(
    (b) => b.STATUSCODE === "CRT" || b.STATUSID === 30
  );

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
 * Gets next day menu published for a canteen where ISKIOSK = 1
 */
export const getNextDayKioskMenu = async (canteenId, serviceDate) => {
  const [rows] = await pool.query(
    `SELECT 
        DM.DAYMENUID,
        DM.DAYSLOTID,
        DS.SERVICEID,
        S.SERVNAME,
        S.STARTTIME,
        S.ENDTIME,
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
       AND DM.STATUSID = 10
     ORDER BY S.STARTTIME ASC, MI.ITEMNAME ASC`,
    [serviceDate, canteenId, serviceDate]
  );
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
 * Gets tomorrow's kiosk-enabled menu for self-service pre-booking
 */
export const getNextDayMenu = async (canteenId) => {
  const tomorrow = getTomorrowIST();
  const items = await getNextDayKioskMenu(canteenId, tomorrow);

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


