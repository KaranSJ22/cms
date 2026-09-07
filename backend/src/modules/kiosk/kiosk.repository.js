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

  // 3. Fallback: Lookup customer directly by user's USERID if customer was missing
  if (user && !customer) {
    try {
      const [custSets] = await pool.query("CALL CMSGETCUSTBYUSER(?)", [user.USERID]);
      if (custSets[0]?.[0]) {
        customer = custSets[0][0];
      }
    } catch (e) {
      const [custRows] = await pool.query(
        "SELECT C.CUSTOMERID, C.CTYPECODE, C.DISPNAME, U.LOGINID FROM CMS_CUSTOMER C JOIN CMS_USER U ON U.USERID = C.USERID WHERE U.USERID = ? LIMIT 1",
        [user.USERID]
      );
      if (custRows[0]) {
        customer = custRows[0];
      }
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
  try {
    const [resultSets] = await pool.query("CALL CMSGETWALLET(?)", [customerId]);
    if (resultSets[0]?.[0]) {
      return resultSets[0][0];
    }
  } catch (err) {
    // Fallback query if SP not present
  }
  const [rows] = await pool.query(
    "SELECT WALLETID, CUSTOMERID, BALANCE, RESERVEDAMT, STATUSID FROM CMS_WALLET WHERE CUSTOMERID = ? LIMIT 1",
    [customerId]
  );
  return rows[0] || null;
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
        MI.ITEMDESC,
        MI.ISVEG,
        P.RATE,
        DM.BOOKUNTIL,
        DM.CANCELUNTIL,
        DM.AVAILQTY,
        DM.MAXQTY
     FROM CMS_DAYMENU DM
     JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
     JOIN CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
     JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
     LEFT JOIN CMS_MENUITEM_PRICE P ON P.MENUITEMID = MI.MENUITEMID 
          AND P.STATUSID = 10 
          AND P.EFFFROM <= ? 
          AND (P.EFFTO IS NULL OR P.EFFTO >= ?)
     WHERE DS.CANTEENID = ?
       AND DS.SERVDATE = ?
       AND DM.ISKIOSK = 1
       AND DM.STATUSID IN (21, 22) -- 22 = Approved, 21 = Pending Approval
     ORDER BY S.STARTTIME ASC, MI.ITEMNAME ASC`,
    [serviceDate, serviceDate, canteenId, serviceDate]
  );
  return rows;
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
  try {
    const [results] = await pool.query("CALL CMSKIOSKGETCURRENTSLOT(?, ?)", [
      canteenId ? Number(canteenId) : null,
      kioskId ? Number(kioskId) : null,
    ]);
    return results[0]?.[0] || null;
  } catch (err) {
    if (err.code === "ER_SP_DOES_NOT_EXIST") {
      const cid = canteenId ? Number(canteenId) : 1;
      const [rows] = await pool.query(
        `SELECT 
            DS.DAYSLOTID,
            DS.SLOTNO,
            DS.SERVICEID,
            S.SERVCODE,
            S.SERVNAME,
            DS.CANTEENID,
            C.CANTEENNAME,
            C.CANTEENCODE,
            DS.SERVDATE,
            DS.STARTTIME,
            DS.ENDTIME,
            (CASE 
              WHEN CURRENT_TIME() BETWEEN (DS.STARTTIME - INTERVAL 15 MINUTE) AND (DS.ENDTIME + INTERVAL 15 MINUTE) THEN 1 
              ELSE 0 
            END) AS ISACTIVENOW,
            'SERVING' AS SLOTSTATE
         FROM CMS_DAYSLOT DS
         JOIN CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
         JOIN CMS_CANTEEN C ON C.CANTEENID = DS.CANTEENID
         WHERE DS.CANTEENID = ?
           AND DS.SERVDATE = CURDATE()
           AND DS.STATUSID = 10
         ORDER BY (CASE WHEN CURRENT_TIME() BETWEEN (DS.STARTTIME - INTERVAL 15 MINUTE) AND (DS.ENDTIME + INTERVAL 15 MINUTE) THEN 0 ELSE 1 END), DS.STARTTIME ASC
         LIMIT 1`,
        [cid]
      );
      return rows[0] || null;
    }
    throw err;
  }
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
 * Lists all operational canteens for kiosk/terminal selection
 */
export const getActiveCanteens = async () => {
  const [rows] = await pool.query(
    "SELECT CANTEENID, CANTEENCODE, CANTEENNAME, LOCATION FROM CMS_CANTEEN WHERE STATUSID = 10 ORDER BY CANTEENID ASC"
  );
  return rows;
};

/**
 * Lists all day slots scheduled for today at a canteen
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

/**
 * Identifies a registered kiosk hardware device by client IP address
 */
export const identifyKioskDevice = async (ip) => {
  const [resultSets] = await pool.query("CALL CMSIDENTIFYKIOSK(?)", [ip]);
  return resultSets?.[0]?.[0] || null;
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


