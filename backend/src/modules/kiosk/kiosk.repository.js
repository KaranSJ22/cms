import { pool } from "../../db/connection.js";

/**
 * Resolves user/customer by Login ID or RFID Access Key in CMS_ACCKEY
 */
export const getLoginInfo = async (identifier) => {
  const trimmed = (identifier || "").trim();
  if (!trimmed) {
    return { USER: null, CUSTOMER: null };
  }

  // 1. Try direct CMSLOGININFO by username/loginId
  const [resultSets] = await pool.query("CALL CMSLOGININFO(?)", [trimmed]);
  const raw = resultSets[0]?.[0];
  if (raw) {
    return {
      USER: {
        USERID: raw.USERID,
        LOGINID: raw.LOGINID,
        FULLNAME: raw.FULLNAME,
        EMAIL: raw.EMAIL,
        MOBILENO: raw.MOBILENO,
        AUTHPROV: raw.AUTHPROV,
        AUTHID: raw.AUTHID,
        ISACTIVE: raw.ISACTIVE,
      },
      CUSTOMER: raw.CUSTOMERID
        ? {
            CUSTOMERID: raw.CUSTOMERID,
            CTYPECODE: raw.CTYPECODE,
            DISPNAME: raw.DISPNAME,
            STATUSID: raw.CUSTOMERSTATUS,
            LOGINID: raw.LOGINID,
          }
        : null,
    };
  }

  // 2. Fallback to CMSFINDCUSTBYIDENTIFIER (matches RFID key, emp code, cont code, customerId)
  const [identSets] = await pool.query("CALL CMSFINDCUSTBYIDENTIFIER(?)", [trimmed]);
  const custRaw = identSets[0]?.[0];
  if (custRaw) {
    return {
      USER: custRaw.USERID
        ? {
            USERID: custRaw.USERID,
            LOGINID: custRaw.LOGINID,
            FULLNAME: custRaw.FULLNAME,
            EMAIL: custRaw.EMAIL,
            MOBILENO: custRaw.MOBILENO,
          }
        : null,
      CUSTOMER: {
        CUSTOMERID: custRaw.CUSTOMERID,
        CTYPECODE: custRaw.CTYPECODE,
        DISPNAME: custRaw.DISPNAME,
        STATUSID: custRaw.STATUSID,
        LOGINID: custRaw.LOGINID || null,
      },
    };
  }

  return {
    USER: null,
    CUSTOMER: null,
  };
};

/**
 * Lists bookings for a customer within date ranges
 */
export const listBookings = async (
  customerId,
  serviceId = null,
  startDate = null,
  endDate = null,
  canteenId = null
) => {
  const [resultSets] = await pool.query("CALL CMSLISTBOOK(?, ?, ?, ?, ?, ?)", [
    customerId,
    serviceId || null,
    startDate || null,
    endDate || null,
    null, // status
    canteenId || null,
  ]);
  return resultSets[0] || [];
};

/**
 * Lists paginated booking history using CMSLISTBOOKHISTORY
 */
export const listBookingsHistory = async (
  customerId,
  startDate = null,
  endDate = null,
  statusCode = null,
  page = 1,
  pageSize = 10
) => {
  const [resultSets] = await pool.query(
    "CALL CMSLISTBOOKHISTORY(?, ?, ?, ?, ?, ?)",
    [
      customerId,
      startDate || null,
      endDate || null,
      statusCode || null,
      Number(page) || 1,
      Number(pageSize) || 10,
    ]
  );
  return resultSets[0] || [];
};

/**
 * Retrieves the last N bookings for self-service kiosk with active upcoming bookings nearest to current date first
 */
export const getKioskCustomerBookings = async (customerId, limit = 10) => {
  const [resultSets] = await pool.query(
    "CALL CMSKIOSKGETCUSTOMERBOOKINGS(?, ?)",
    [Number(customerId), Number(limit) || 10]
  );
  return resultSets[0] || [];
};

/**
 * Gets wallet details for eligible customers
 */
export const getCustomerWallet = async (customerId) => {
  const [resultSets] = await pool.query("CALL CMSGETWALLET(?)", [customerId]);
  return resultSets[0]?.[0] || null;
};

/**
 * Cancels a booking via CMSCANCELBOOK
 */
export const cancelBooking = async (bookingId, userId, reason = "Cancelled at Kiosk") => {
  const [result] = await pool.query(
    "CALL CMSCANCELBOOK(?, ?, ?, ?)",
    [bookingId, userId, 0, reason]
  );
  return result;
};

/**
 * Heartbeat recording
 */
export const recordHeartbeat = async (kioskId, ipAddress) => {
  const [result] = await pool.query("CALL CMSHEARTBEATKIOSK(?, ?)", [kioskId, ipAddress]);
  return result;
};

/**
 * Gets currently operating or next upcoming meal slot for the kiosk terminal
 */
export const getCurrentSlot = async (canteenId = null, kioskId = null) => {
  const [results] = await pool.query("CALL CMSKIOSKGETCURRENTSLOT(?, ?)", [
    canteenId ? Number(canteenId) : null,
    kioskId ? Number(kioskId) : null,
  ]);
  return results[0]?.[0] || null;
};

/**
 * Resolves active booking for serving with time/meal-slot awareness
 */
export const resolveKioskBooking = async (identifier, canteenId = null, kioskId = null, daySlotId = null) => {
  const trimmed = (identifier || "").trim();
  const [results] = await pool.query("CALL CMSKIOSKRESOLVEBOOKING(?, ?, ?, ?)", [
    trimmed,
    canteenId ? Number(canteenId) : null,
    kioskId ? Number(kioskId) : null,
    daySlotId ? Number(daySlotId) : null,
  ]);

  if (!results || results.length < 2 || !results[0] || results[0].length === 0) {
    return null;
  }

  return {
    HEADER: results[0][0],
    ITEMS: results[1] || [],
  };
};

/**
 * Marks booking as served at a kiosk terminal with audit and wallet settlement
 */
export const serveKioskBooking = async (bookingId, userId, kioskId = null) => {
  const [results] = await pool.query("CALL CMSKIOSKSERVEBOOKING(?, ?, ?)", [
    Number(bookingId),
    Number(userId),
    kioskId ? Number(kioskId) : null,
  ]);
  return results[0]?.[0] || null;
};

/**
 * High-speed single round-trip scan for self-service kiosk
 */
export const scanSelfServiceAtomic = async (identifier, canteenId = null, kioskId = null) => {
  const [results] = await pool.query("CALL CMSKIOSKSCANSELFSERVICE(?, ?, ?)", [
    identifier ? String(identifier).trim() : "",
    canteenId ? Number(canteenId) : null,
    kioskId ? Number(kioskId) : null,
  ]);

  const customer = results[0]?.[0] || null;
  const todayBookings = results[1] || [];
  const upcomingBookings = results[2] || [];

  return {
    customer,
    todayBookings,
    upcomingBookings,
  };
};

/**
 * Identifies a registered kiosk hardware device by client IP address
 */
export const identifyKioskDevice = async (ip) => {
  const [resultSets] = await pool.query("CALL CMSIDENTIFYKIOSK(?)", [ip]);
  return resultSets?.[0]?.[0] || null;
};

/**
 * Registers or updates a hardware kiosk terminal device
 */
export const registerKioskDevice = async ({
  DEVICECODE,
  DEVICENAME,
  IPADDRESS,
  MACADDRESS = null,
  CANTEENID,
  KIOSKTYPE,
  USERID,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSREGISTERKIOSKDEVICE(?, ?, ?, ?, ?, ?, ?)",
    [DEVICECODE, DEVICENAME, IPADDRESS, MACADDRESS, CANTEENID, KIOSKTYPE, USERID]
  );
  return resultSets[0]?.[0] || null;
};

/**
 * Lists all registered kiosk devices, optionally filtered by canteen
 */
export const listKioskDevices = async (CANTEENID = null) => {
  const [resultSets] = await pool.query(
    "CALL CMSLISTKIOSKDEVICES(?)",
    [CANTEENID]
  );
  return (resultSets[0] || []).map((row) => ({
    ...row,
    STATUSID:
      row.STATUSID != null
        ? Number(row.STATUSID)
        : row.ISACTIVE === 1 || row.STATUSCODE === "ACT"
        ? 10
        : 11,
  }));
};

/**
 * Gets tomorrow's available meal services for a canteen
 */
export const getNextDayServices = async (canteenId, serviceDate) => {
  const [resultSets] = await pool.query(
    "CALL CMSKIOSKGETNEXTDAYSERVICES(?, ?)",
    [Number(canteenId), serviceDate]
  );
  return resultSets[0] || [];
};

/**
 * Gets next day menu published for a canteen where ISKIOSK = 1
 */
export const getNextDayKioskMenu = async (canteenId, serviceDate, serviceId = null) => {
  const [resultSets] = await pool.query(
    "CALL CMSGETKIOSKPUBLISHEDMENU(?, ?, ?)",
    [Number(canteenId), serviceDate, serviceId ? Number(serviceId) : null]
  );
  return resultSets[0] || [];
};

/**
 * Resolves USERID and CUSTOMERID from customer record
 */
export const getCustomerUser = async (customerId) => {
  const [resultSets] = await pool.query("CALL CMSGETCUST(?)", [Number(customerId)]);
  const customer = resultSets[0]?.[0];
  if (!customer) return null;
  return {
    CUSTOMERID: customer.CUSTOMERID,
    USERID: customer.USERID,
  };
};

/**
 * Retrieves basic booking metadata for validation and authorization
 */
export const getBookingBasic = async (bookingId) => {
  const [resultSets] = await pool.query("CALL CMSGETBOOKINGBASIC(?)", [Number(bookingId)]);
  return resultSets[0]?.[0] || null;
};

/**
 * Checks for existing booking (by offline UUID pattern or by customer + service + date)
 */
export const checkBookingExists = async ({
  customerId = null,
  serviceId = null,
  serviceDate = null,
  remarks = null,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSCHECKBOOKINGEXISTS(?, ?, ?, ?)",
    [
      customerId ? Number(customerId) : null,
      serviceId ? Number(serviceId) : null,
      serviceDate || null,
      remarks && remarks.trim() ? remarks.trim() : null,
    ]
  );
  return resultSets[0]?.[0] || null;
};

/**
 * Retrieves all active canteens
 */
export const getActiveCanteens = async () => {
  const [resultSets] = await pool.query("CALL CMSLISTCANTEEN(?)", [null]);
  return (resultSets[0] || []).filter(
    (c) => c.STATUSID === 10 || c.STATUSCODE === "ACT"
  );
};

/**
 * Retrieves all meal slots scheduled for today at a canteen
 */
export const getTodaySlots = async (canteenId) => {
  const [resultSets] = await pool.query("CALL CMSLISTTODAYMEALSLOTS(?)", [Number(canteenId)]);
  return resultSets[0] || [];
};

/**
 * Master data bootstrap package snapshot for offline kiosk terminals
 */
export const getBootstrapPackage = async (canteenId = 1, today = null) => {
  const [resultSets] = await pool.query(
    "CALL CMSKIOSKGETBOOTSTRAP(?, ?)",
    [Number(canteenId) || 1, today || null]
  );
  return {
    lastChange: resultSets[0]?.[0]?.LAST_CHANGE || null,
    customers: resultSets[1] || [],
    wallets: resultSets[2] || [],
    daySlots: resultSets[3] || [],
    menuItems: resultSets[4] || [],
    activeBookings: resultSets[5] || [],
    todayBookings: resultSets[6] || [],
    todayBookItems: resultSets[7] || [],
  };
};

/**
 * Updates a kiosk device's operational status
 */
export const updateKioskDeviceStatus = async (kioskId, statusId, userId) => {
  const [resultSets] = await pool.query(
    "CALL CMSUPDATEKIOSKSTATUS(?, ?, ?)",
    [Number(kioskId), Number(statusId), Number(userId)]
  );
  return resultSets[0]?.[0] || null;
};
