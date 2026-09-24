import { pool } from "../../db/connection.js";

/**
 * Resolves user/customer by Login ID or RFID Access Key in CMS_ACCKEY
 */
export const getLoginInfo = async (identifier) => {
  const trimmed = (identifier || "").trim();

  // 1. Try direct CMSLOGININFO by username/loginId
  let [resultSets] = await pool.query("CALL CMSLOGININFO(?)", [trimmed]);
  let raw = resultSets[0]?.[0];
  let user = raw
    ? {
        USERID: raw.USERID,
        LOGINID: raw.LOGINID,
        FULLNAME: raw.FULLNAME,
        EMAIL: raw.EMAIL,
        MOBILENO: raw.MOBILENO,
        AUTHPROV: raw.AUTHPROV,
        AUTHID: raw.AUTHID,
        ISACTIVE: raw.ISACTIVE,
      }
    : null;

  let customer = raw?.CUSTOMERID
    ? {
        CUSTOMERID: raw.CUSTOMERID,
        CTYPECODE: raw.CTYPECODE,
        DISPNAME: raw.DISPNAME,
        STATUSID: raw.CUSTOMERSTATUS,
        LOGINID: raw.LOGINID,
      }
    : null;

  // 2. If not found, check if it's an RFID / Access Key in CMS_ACCKEY
  if (!user && !customer) {
    try {
      const [keySets] = await pool.query("CALL CMSVALIDATEACCKEY(?)", [trimmed]);
      const keyIdentity = keySets[0]?.[0];
      if (keyIdentity && keyIdentity.LOGINID) {
        [resultSets] = await pool.query("CALL CMSLOGININFO(?)", [keyIdentity.LOGINID]);
        const rawKey = resultSets[0]?.[0];
        if (rawKey) {
          user = {
            USERID: rawKey.USERID,
            LOGINID: rawKey.LOGINID,
            FULLNAME: rawKey.FULLNAME,
            EMAIL: rawKey.EMAIL,
            MOBILENO: rawKey.MOBILENO,
            AUTHPROV: rawKey.AUTHPROV,
            AUTHID: rawKey.AUTHID,
            ISACTIVE: rawKey.ISACTIVE,
          };
          customer = rawKey.CUSTOMERID
            ? {
                CUSTOMERID: rawKey.CUSTOMERID,
                CTYPECODE: rawKey.CTYPECODE,
                DISPNAME: rawKey.DISPNAME,
                STATUSID: rawKey.CUSTOMERSTATUS,
                LOGINID: rawKey.LOGINID,
              }
            : null;
        }
      } else if (keyIdentity && keyIdentity.CUSTOMERID) {
        customer = {
          CUSTOMERID: keyIdentity.CUSTOMERID,
          CTYPECODE: keyIdentity.CTYPECODE,
          DISPNAME: keyIdentity.DISPNAME,
          LOGINID: keyIdentity.LOGINID || null,
        };
      }
    } catch (e) {
      // Not a registered access key
    }
  }

  // 3. Lookup customer directly by user's USERID if customer was missing
  if (user && !customer) {
    try {
      const [custSets] = await pool.query("CALL CMSGETCUSTBYUSER(?)", [user.USERID]);
      if (custSets[0]?.[0]) {
        customer = custSets[0][0];
      }
    } catch (e) {
      // Customer lookup failed
    }
  }

  return {
    USER: user || null,
    CUSTOMER: customer || null,
  };
};

/**
 * Lists bookings for a customer within date ranges
 */
export const listBookings = async (customerId, serviceId, startDate, endDate) => {
  const [resultSets] = await pool.query("CALL CMSLISTBOOK(?, ?, ?, ?, ?)", [
    customerId,
    serviceId || null,
    startDate || null,
    endDate || null,
    null, // status
  ]);
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
  const isBookNo = trimmed.toUpperCase().startsWith("PB") || trimmed.toUpperCase().startsWith("BK");
  let results;
  try {
    [results] = await pool.query("CALL CMSKIOSKRESOLVEBOOKING(?, ?, ?, ?)", [
      trimmed,
      canteenId ? Number(canteenId) : null,
      kioskId ? Number(kioskId) : null,
      daySlotId ? Number(daySlotId) : null,
    ]);
  } catch (err) {
    if (err.code === "ER_SP_DOES_NOT_EXIST") {
      try {
        [results] = await pool.query("CALL CMSGETBOOKFORSERVING(?, ?, ?, ?)", [
          isBookNo ? null : trimmed,
          isBookNo ? trimmed : null,
          canteenId ? Number(canteenId) : null,
          null,
        ]);
      } catch (err2) {
        if (err2.code === "ER_WRONG_PARAMCOUNT_TO_PROCEDURE") {
          [results] = await pool.query("CALL CMSGETBOOKFORSERVING(?, ?)", [
            isBookNo ? null : trimmed,
            isBookNo ? trimmed : null,
          ]);
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

/**
 * Marks booking as served at a kiosk terminal with audit and wallet settlement
 */
export const serveKioskBooking = async (bookingId, userId, kioskId = null) => {
  try {
    const [results] = await pool.query("CALL CMSKIOSKSERVEBOOKING(?, ?, ?)", [
      Number(bookingId),
      Number(userId),
      kioskId ? Number(kioskId) : null,
    ]);
    return results[0]?.[0] || null;
  } catch (err) {
    if (err.code === "ER_SP_DOES_NOT_EXIST") {
      const [results] = await pool.query("CALL CMSMARKBOOKINGSERVED(?, ?)", [
        Number(bookingId),
        Number(userId),
      ]);
      return results[0]?.[0] || { BOOKID: bookingId, RESULT: "SUCCESS" };
    }
    throw err;
  }
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
