import dayjs from "dayjs";
import { pool, withTransaction } from "../../db/connection.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../common/errors/appError.js";
import { logger } from "../../utils/logger.js";
import {
  TIMEZONE_IST,
  getNowIST,
  getTodayIST,
  getCurrentYearIST,
  toMySQLDateTime,
} from "../../utils/dateTime.js";

// Status IDs corresponding to CMS_STATUS seed
const STATUS = {
  ACTIVE: 10,
  DISABLED: 11,
  SUBMITTED: 35,
  PENDING_MANAGER: 36,
  CONFIRMED: 37,
  REJECTED: 38,
};

// ============================================================
// 1. SERVICES & COMBOS (CANTEEN MANAGER)
// ============================================================

export const listServicesByCanteen = async (canteenId, statusId = null) => {
  let query = `
    SELECT 
      os.OFFSERVID,
      os.CANTEENID,
      c.CANTEENNAME,
      os.SERVNAME,
      os.DESCR,
      os.CUTOFFHOURS,
      os.REQAPPRLVL,
      os.STATUSID,
      st.STATUSNAME,
      os.CREATEDAT
    FROM CMS_OFFSERV os
    JOIN CMS_CANTEEN c ON c.CANTEENID = os.CANTEENID
    JOIN CMS_STATUS st ON st.STATUSID = os.STATUSID
    WHERE os.CANTEENID = ?
  `;
  const params = [canteenId];

  if (statusId) {
    query += " AND os.STATUSID = ?";
    params.push(statusId);
  }

  query += " ORDER BY os.OFFSERVID DESC";

  const [services] = await pool.query(query, params);

  if (!services || services.length === 0) {
    return [];
  }

  // Fetch combos for each service
  const serviceIds = services.map((s) => s.OFFSERVID);
  const [combos] = await pool.query(
    `
    SELECT 
      oc.OFFCOMBOID,
      oc.OFFSERVID,
      oc.COMBONAME,
      oc.DESCR,
      oc.GROSSPRICE,
      oc.HANDLINGCHARGE,
      oc.COMBOPRICE,
      oc.STATUSID,
      st.STATUSNAME
    FROM CMS_OFFCOMBO oc
    JOIN CMS_STATUS st ON st.STATUSID = oc.STATUSID
    WHERE oc.OFFSERVID IN (?) AND oc.STATUSID = 10
    ORDER BY oc.OFFCOMBOID ASC
    `,
    [serviceIds]
  );

  // Fetch items for all combos so UI can display dishes
  if (combos.length > 0) {
    const comboIds = combos.map((c) => c.OFFCOMBOID);
    const [comboItems] = await pool.query(
      `
      SELECT 
        oci.OFFCOMBOID,
        oci.COMBOITEMID,
        oci.MENUITEMID,
        mi.ITEMNAME AS MENUNAME,
        mi.ITEMNAME,
        mi.SHORTNAME,
        COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
        oci.QTY,
        COALESCE(
          (SELECT d.PRICE 
           FROM CMS_ITEMPRICE p
           JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
           WHERE p.MENUITEMID = mi.MENUITEMID 
             AND d.CTYPECODE = 'OFF'
             AND p.STATUSID = 10
           ORDER BY p.EFFFROM DESC LIMIT 1), 
          0.00
        ) AS OFFPRICE
      FROM CMS_OFFCOMBO_ITEM oci
      JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
      LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
      WHERE oci.OFFCOMBOID IN (?)
      ORDER BY mi.ITEMNAME ASC
      `,
      [comboIds]
    );

    const itemsByCombo = {};
    for (const item of comboItems) {
      if (!itemsByCombo[item.OFFCOMBOID]) {
        itemsByCombo[item.OFFCOMBOID] = [];
      }
      itemsByCombo[item.OFFCOMBOID].push(item);
    }

    for (const combo of combos) {
      combo.ITEMS = itemsByCombo[combo.OFFCOMBOID] || [];
    }
  }

  // Group combos by service
  const combosByService = {};
  for (const combo of combos) {
    if (!combosByService[combo.OFFSERVID]) {
      combosByService[combo.OFFSERVID] = [];
    }
    combosByService[combo.OFFSERVID].push(combo);
  }

  return services.map((s) => ({
    ...s,
    COMBOS: combosByService[s.OFFSERVID] || [],
  }));
};

export const getServiceDetails = async (serviceId) => {
  const [services] = await pool.query(
    `
    SELECT 
      os.OFFSERVID,
      os.CANTEENID,
      c.CANTEENNAME,
      os.SERVNAME,
      os.DESCR,
      os.CUTOFFHOURS,
      os.REQAPPRLVL,
      os.STATUSID,
      st.STATUSNAME,
      os.CREATEDAT
    FROM CMS_OFFSERV os
    JOIN CMS_CANTEEN c ON c.CANTEENID = os.CANTEENID
    JOIN CMS_STATUS st ON st.STATUSID = os.STATUSID
    WHERE os.OFFSERVID = ?
    `,
    [serviceId]
  );

  const service = services[0];
  if (!service) {
    throw new NotFoundError("Official Service not found");
  }

  // Fetch combos with items
  const [combos] = await pool.query(
    `
    SELECT 
      oc.OFFCOMBOID,
      oc.OFFSERVID,
      oc.COMBONAME,
      oc.DESCR,
      oc.GROSSPRICE,
      oc.HANDLINGCHARGE,
      oc.COMBOPRICE,
      oc.STATUSID,
      st.STATUSNAME
    FROM CMS_OFFCOMBO oc
    JOIN CMS_STATUS st ON st.STATUSID = oc.STATUSID
    WHERE oc.OFFSERVID = ?
    `,
    [serviceId]
  );

  if (combos.length > 0) {
    const comboIds = combos.map((c) => c.OFFCOMBOID);
    const [items] = await pool.query(
      `
      SELECT 
        oci.OFFCOMBOID,
        oci.COMBOITEMID,
        oci.MENUITEMID,
        mi.ITEMNAME AS MENUNAME,
        mi.ITEMNAME,
        mi.SHORTNAME,
        COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
        oci.QTY,
        COALESCE(
          (SELECT d.PRICE 
           FROM CMS_ITEMPRICE p
           JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
           WHERE p.MENUITEMID = mi.MENUITEMID 
             AND d.CTYPECODE = 'OFF'
             AND p.STATUSID = 10
           ORDER BY p.EFFFROM DESC LIMIT 1), 
          0.00
        ) AS OFFPRICE
      FROM CMS_OFFCOMBO_ITEM oci
      JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
      LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
      WHERE oci.OFFCOMBOID IN (?)
      ORDER BY mi.ITEMNAME ASC
      `,
      [comboIds]
    );

    const itemsByCombo = {};
    for (const item of items) {
      if (!itemsByCombo[item.OFFCOMBOID]) {
        itemsByCombo[item.OFFCOMBOID] = [];
      }
      itemsByCombo[item.OFFCOMBOID].push(item);
    }

    service.COMBOS = combos.map((c) => ({
      ...c,
      ITEMS: itemsByCombo[c.OFFCOMBOID] || [],
    }));
  } else {
    service.COMBOS = [];
  }

  return service;
};

export const createService = async (serviceData, userId) => {
  const { CANTEENID, SERVNAME, DESCR, CUTOFFHOURS, REQAPPRLVL } = serviceData;

  const [result] = await pool.query(
    `
    INSERT INTO CMS_OFFSERV (CANTEENID, SERVNAME, DESCR, CUTOFFHOURS, REQAPPRLVL, STATUSID, CREATEDBY)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [CANTEENID, SERVNAME, DESCR || null, CUTOFFHOURS || 24, REQAPPRLVL || "L1", STATUS.ACTIVE, userId]
  );

  return getServiceDetails(result.insertId);
};

export const updateService = async (serviceId, updateData, userId) => {
  const fields = [];
  const params = [];

  if (updateData.SERVNAME !== undefined) {
    fields.push("SERVNAME = ?");
    params.push(updateData.SERVNAME);
  }
  if (updateData.DESCR !== undefined) {
    fields.push("DESCR = ?");
    params.push(updateData.DESCR);
  }
  if (updateData.CUTOFFHOURS !== undefined) {
    fields.push("CUTOFFHOURS = ?");
    params.push(updateData.CUTOFFHOURS);
  }
  if (updateData.REQAPPRLVL !== undefined) {
    fields.push("REQAPPRLVL = ?");
    params.push(updateData.REQAPPRLVL);
  }
  if (updateData.STATUSID !== undefined) {
    fields.push("STATUSID = ?");
    params.push(updateData.STATUSID);
  }

  if (fields.length === 0) {
    return getServiceDetails(serviceId);
  }

  fields.push("UPDATEDBY = ?");
  params.push(userId);
  params.push(serviceId);

  await pool.query(
    `UPDATE CMS_OFFSERV SET ${fields.join(", ")} WHERE OFFSERVID = ?`,
    params
  );

  return getServiceDetails(serviceId);
};

export const createCombo = async (comboData, userId) => {
  const { OFFSERVID, COMBONAME, DESCR, GROSSPRICE, HANDLINGCHARGE, COMBOPRICE, ITEMS } = comboData;

  return await withTransaction(async (conn) => {
    // 1. Insert combo header
    const grossVal = GROSSPRICE !== undefined ? GROSSPRICE : COMBOPRICE;
    const handlingVal = HANDLINGCHARGE !== undefined ? HANDLINGCHARGE : 0.0;
    const comboPriceVal = COMBOPRICE !== undefined ? COMBOPRICE : grossVal;

    const [comboRes] = await conn.query(
      `
      INSERT INTO CMS_OFFCOMBO (OFFSERVID, COMBONAME, DESCR, GROSSPRICE, HANDLINGCHARGE, COMBOPRICE, STATUSID, CREATEDBY)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [OFFSERVID, COMBONAME, DESCR || null, grossVal, handlingVal, comboPriceVal, STATUS.ACTIVE, userId]
    );

    const comboId = comboRes.insertId;

    // 2. Insert items
    if (ITEMS && ITEMS.length > 0) {
      const itemValues = ITEMS.map((it) => [comboId, it.MENUITEMID, it.QTY || 1]);
      await conn.query(
        `INSERT INTO CMS_OFFCOMBO_ITEM (OFFCOMBOID, MENUITEMID, QTY) VALUES ?`,
        [itemValues]
      );
    }

    return comboId;
  });
};

export const updateCombo = async (comboId, updateData, userId) => {
  return await withTransaction(async (conn) => {
    const fields = [];
    const params = [];

    if (updateData.COMBONAME !== undefined) {
      fields.push("COMBONAME = ?");
      params.push(updateData.COMBONAME);
    }
    if (updateData.DESCR !== undefined) {
      fields.push("DESCR = ?");
      params.push(updateData.DESCR);
    }
    if (updateData.GROSSPRICE !== undefined) {
      fields.push("GROSSPRICE = ?");
      params.push(updateData.GROSSPRICE);
    }
    if (updateData.HANDLINGCHARGE !== undefined) {
      fields.push("HANDLINGCHARGE = ?");
      params.push(updateData.HANDLINGCHARGE);
    }
    if (updateData.COMBOPRICE !== undefined) {
      fields.push("COMBOPRICE = ?");
      params.push(updateData.COMBOPRICE);
    }
    if (updateData.STATUSID !== undefined) {
      fields.push("STATUSID = ?");
      params.push(updateData.STATUSID);
    }

    if (fields.length > 0) {
      fields.push("UPDATEDBY = ?");
      params.push(userId);
      params.push(comboId);

      await conn.query(
        `UPDATE CMS_OFFCOMBO SET ${fields.join(", ")} WHERE OFFCOMBOID = ?`,
        params
      );
    }

    if (updateData.ITEMS && Array.isArray(updateData.ITEMS)) {
      await conn.query(`DELETE FROM CMS_OFFCOMBO_ITEM WHERE OFFCOMBOID = ?`, [comboId]);
      if (updateData.ITEMS.length > 0) {
        const itemValues = updateData.ITEMS.map((it) => [comboId, it.MENUITEMID, it.QTY || 1]);
        await conn.query(
          `INSERT INTO CMS_OFFCOMBO_ITEM (OFFCOMBOID, MENUITEMID, QTY) VALUES ?`,
          [itemValues]
        );
      }
    }

    return true;
  });
};

export const deleteCombo = async (comboId, userId) => {
  return await withTransaction(async (conn) => {
    const [bookingCheck] = await conn.query(
      `SELECT COUNT(*) AS count FROM CMS_OFFBOOK WHERE OFFCOMBOID = ?`,
      [comboId]
    );
    const hasBookings = (bookingCheck[0]?.count || 0) > 0;

    if (hasBookings) {
      // Soft-delete to preserve booking audit integrity (status 11 = DIS)
      await conn.query(
        `UPDATE CMS_OFFCOMBO SET STATUSID = 11, UPDATEDBY = ?, UPDATEDAT = CURRENT_TIMESTAMP WHERE OFFCOMBOID = ?`,
        [userId, comboId]
      );
    } else {
      // Hard delete combo items and combo
      await conn.query(`DELETE FROM CMS_OFFCOMBO_ITEM WHERE OFFCOMBOID = ?`, [comboId]);
      await conn.query(`DELETE FROM CMS_OFFCOMBO WHERE OFFCOMBOID = ?`, [comboId]);
    }
    return true;
  });
};

export const listAvailableMenuItems = async (canteenId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      mi.MENUITEMID,
      mi.MENUCODE,
      mi.ITEMNAME AS MENUNAME,
      mi.ITEMNAME,
      mi.SHORTNAME,
      s.SERVICEID,
      s.SERVNAME,
      COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
      mi.OFFSER,
      mi.STATUSID,
      COALESCE(
        (SELECT d.PRICE 
         FROM CMS_ITEMPRICE p
         JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
         WHERE p.MENUITEMID = mi.MENUITEMID 
           AND d.CTYPECODE = 'OFF'
           AND p.STATUSID = 10
         ORDER BY p.EFFFROM DESC LIMIT 1), 
        0.00
      ) AS OFFPRICE
    FROM CMS_MENUITEM mi
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE mi.STATUSID = 10 AND mi.OFFSER = 1
    HAVING OFFPRICE > 0
    ORDER BY mi.ITEMNAME ASC
    `
  );
  return rows.map((r) => ({
    ...r,
    UNITPRICE: Number(r.OFFPRICE),
  }));
};

// ============================================================
// 2. LEVEL MAPPINGS & APPROVER ELIGIBILITY
// ============================================================

export const listLevelMappings = async () => {
  const [rows] = await pool.query(
    `
    SELECT 
      LVLMAPID,
      EMPLEVEL,
      APPRLVL,
      ISACTIVE,
      UPDATEDAT
    FROM CMS_LVLMAP
    ORDER BY EMPLEVEL ASC
    `
  );
  return rows;
};

export const upsertLevelMapping = async ({ EMPLEVEL, APPRLVL, ISACTIVE = 1 }, userId) => {
  await pool.query(
    `
    INSERT INTO CMS_LVLMAP (EMPLEVEL, APPRLVL, ISACTIVE, CREATEDBY, UPDATEDBY)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      APPRLVL = VALUES(APPRLVL),
      ISACTIVE = VALUES(ISACTIVE),
      UPDATEDBY = VALUES(UPDATEDBY)
    `,
    [EMPLEVEL, APPRLVL, ISACTIVE, userId, userId]
  );
  return listLevelMappings();
};

export const getEligibleApprovers = async (apprLvl, requesterUserId) => {
  let lvlFilter = "";
  if (apprLvl === "L1") {
    lvlFilter = "AND lm.APPRLVL IN ('L1', 'L2')";
  } else if (apprLvl === "L2") {
    lvlFilter = "AND lm.APPRLVL = 'L2'";
  }

  const [rows] = await pool.query(
    `
    SELECT 
      u.USERID,
      u.FULLNAME,
      pe.EMPCODE,
      pe.DEPT,
      pe.DESIG,
      pe.LEVEL,
      lm.APPRLVL
    FROM CMS_USER u
    JOIN CMS_CUSTOMER c ON c.USERID = u.USERID
    JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
    JOIN CMS_LVLMAP lm ON lm.EMPLEVEL = pe.LEVEL AND lm.ISACTIVE = 1
    WHERE u.ISACTIVE = 1
      AND c.STATUSID = 10
      AND u.USERID != ?
      ${lvlFilter}
    ORDER BY u.FULLNAME ASC
    `,
    [requesterUserId]
  );

  return rows;
};

// ============================================================
// 3. BOOKING CREATION & NUMBER GENERATION (EMPLOYEE)
// ============================================================

const generateOfficialBookingNumber = async (canteenId, conn) => {
  // Get canteen code
  const [cantRows] = await conn.query(
    `SELECT CANTEENCODE FROM CMS_CANTEEN WHERE CANTEENID = ?`,
    [canteenId]
  );
  const canteenCode = cantRows[0]?.CANTEENCODE || "CAN";

  // Daily partition based on Indian Standard Time (IST)
  const todayDate = getTodayIST(); // "YYYY-MM-DD"
  const dateFormatted = todayDate.replace(/-/g, ""); // "YYYYMMDD"

  // 1. Ensure counter record exists for (canteenId, todayDate)
  await conn.query(
    `
    INSERT INTO CMS_OFFBOOKCTR (CANTEENID, BOOKDATE, LASTNO)
    VALUES (?, ?, 0)
    ON DUPLICATE KEY UPDATE LASTNO = LASTNO
    `,
    [canteenId, todayDate]
  );

  // 2. Lock counter record
  const [ctrRows] = await conn.query(
    `
    SELECT LASTNO 
    FROM CMS_OFFBOOKCTR 
    WHERE CANTEENID = ? AND BOOKDATE = ?
    FOR UPDATE
    `,
    [canteenId, todayDate]
  );

  const counterVal = Number(ctrRows[0]?.LASTNO || 0);

  // 3. Self-healing / fail-safe sync:
  // Query CMS_OFFBOOK for existing maximum sequence for today's prefix to guarantee zero duplicate collisions
  const prefix = `OBK-${canteenCode}-${dateFormatted}-`;
  const [maxRows] = await conn.query(
    `
    SELECT MAX(CAST(SUBSTRING(BOOKNO, ?) AS UNSIGNED)) AS maxSeq
    FROM CMS_OFFBOOK
    WHERE BOOKNO LIKE ?
    `,
    [prefix.length + 1, `${prefix}%`]
  );
  const maxExistingSeq = Number(maxRows[0]?.maxSeq || 0);

  const nextSeq = Math.max(counterVal, maxExistingSeq) + 1;

  // 4. Update counter to nextSeq
  await conn.query(
    `UPDATE CMS_OFFBOOKCTR SET LASTNO = ? WHERE CANTEENID = ? AND BOOKDATE = ?`,
    [nextSeq, canteenId, todayDate]
  );

  const padded = String(nextSeq).padStart(4, "0");
  return `${prefix}${padded}`;
};

export const createOfficialBooking = async (bookingData, user) => {
  const {
    CANTEENID,
    OFFSERVID,
    OFFCOMBOID,
    PURPOSE,
    VENUE,
    EVENTDATETIME,
    QUANTITY,
    NOOFPEOPLE,
    APPRLVL,
    APPROVERID,
  } = bookingData;

  // 1. Permanent Employee Verification
  if (user.CTYPECODE !== "PRM") {
    throw new ForbiddenError("Only permanent employees can create Official Bookings");
  }

  // 2. Self-Approval Prevention
  if (Number(APPROVERID) === Number(user.USERID)) {
    throw new BadRequestError("Self-approval is not allowed. Please select another eligible approver.");
  }

  // 3. Check service, approval level and cutoff
  const [svcRows] = await pool.query(
    `SELECT OFFSERVID, SERVNAME, CUTOFFHOURS, REQAPPRLVL, STATUSID FROM CMS_OFFSERV WHERE OFFSERVID = ?`,
    [OFFSERVID]
  );
  const service = svcRows[0];
  if (!service || service.STATUSID !== STATUS.ACTIVE) {
    throw new BadRequestError("The requested Official Service is not active or does not exist");
  }

  // Verify approver eligibility against service required level
  const [apprRows] = await pool.query(
    `
    SELECT lm.APPRLVL
    FROM CMS_USER u
    JOIN CMS_CUSTOMER c ON c.USERID = u.USERID
    JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
    JOIN CMS_LVLMAP lm ON lm.EMPLEVEL = pe.LEVEL AND lm.ISACTIVE = 1
    WHERE u.USERID = ? AND u.ISACTIVE = 1 AND c.STATUSID = 10
    `,
    [APPROVERID]
  );
  const approverTier = apprRows[0]?.APPRLVL;
  if (!approverTier) {
    throw new BadRequestError("Selected approver is not mapped to an active approval level");
  }
  if (service.REQAPPRLVL === "L2" && approverTier !== "L2") {
    throw new BadRequestError("This service requires Level 2 approval. You must select a Level 2 approver.");
  }

  const eventDateTimeIST = toMySQLDateTime(EVENTDATETIME);
  const eventTime = dayjs.tz(eventDateTimeIST, TIMEZONE_IST).valueOf();
  const leadTimeHours = (eventTime - getNowIST().valueOf()) / (1000 * 60 * 60);

  if (leadTimeHours < service.CUTOFFHOURS) {
    throw new BadRequestError(
      `Booking cutoff violation: ${service.SERVNAME} requires at least ${service.CUTOFFHOURS} hours notice prior to the event.`
    );
  }

  // 4. Validate combo and price calculation
  // Formula: Total = (Quantity * Gross Price) + Handling Charges
  const [comboRows] = await pool.query(
    `SELECT OFFCOMBOID, COMBONAME, GROSSPRICE, HANDLINGCHARGE, COMBOPRICE, STATUSID FROM CMS_OFFCOMBO WHERE OFFCOMBOID = ? AND OFFSERVID = ?`,
    [OFFCOMBOID, OFFSERVID]
  );
  const combo = comboRows[0];
  if (!combo || combo.STATUSID !== STATUS.ACTIVE) {
    throw new BadRequestError("The selected combo is not active or does not belong to this service");
  }

  const grossUnitPrice = Number(combo.GROSSPRICE !== undefined && combo.GROSSPRICE !== null ? combo.GROSSPRICE : combo.COMBOPRICE);
  const handlingCharge = Number(combo.HANDLINGCHARGE || 0);
  const totalAmount = Number(((Number(QUANTITY) * grossUnitPrice) + handlingCharge).toFixed(2));

  // 5. Execute transactional insert
  return await withTransaction(async (conn) => {
    const bookNo = await generateOfficialBookingNumber(CANTEENID, conn);

    const [insRes] = await conn.query(
      `
      INSERT INTO CMS_OFFBOOK (
        BOOKNO, CANTEENID, OFFSERVID, OFFCOMBOID, CUSTOMERID, BOOKEDBY,
        PURPOSE, VENUE, EVENTDATETIME, QUANTITY, NOOFPEOPLE,
        UNITPRICE, HANDLINGCHARGE, TOTALAMOUNT, APPRLVL, APPROVERID, STATUSID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        bookNo,
        CANTEENID,
        OFFSERVID,
        OFFCOMBOID,
        user.CUSTOMERID,
        user.USERID,
        PURPOSE,
        VENUE,
        eventDateTimeIST,
        QUANTITY,
        NOOFPEOPLE,
        grossUnitPrice,
        handlingCharge,
        totalAmount,
        APPRLVL || approverTier,
        APPROVERID,
        STATUS.SUBMITTED,
      ]
    );

    const bookingId = insRes.insertId;

    // Record initial submission audit
    await conn.query(
      `
      INSERT INTO CMS_OFFAPPR (OFFBOOKID, ACTIONBY, ACTIONROLE, ACTION, REJREASON)
      VALUES (?, ?, 'EMPLOYEE', 'SUBMITTED', NULL)
      `,
      [bookingId, user.USERID]
    );

    logger.info({ bookingId, bookNo, userId: user.USERID }, "Official booking created successfully");

    return {
      OFFBOOKID: bookingId,
      BOOKNO: bookNo,
      STATUS: "Submitted",
      UNITPRICE: grossUnitPrice,
      HANDLINGCHARGE: handlingCharge,
      TOTALAMOUNT: totalAmount,
    };
  });
};

export const getOfficialBookingById = async (bookingId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      ob.OFFBOOKID,
      ob.BOOKNO,
      ob.CANTEENID,
      c.CANTEENNAME,
      ob.OFFSERVID,
      os.SERVNAME,
      os.REQAPPRLVL,
      ob.OFFCOMBOID,
      oc.COMBONAME,
      oc.GROSSPRICE,
      oc.HANDLINGCHARGE AS COMBO_HANDLINGCHARGE,
      ob.CUSTOMERID,
      u_emp.FULLNAME AS REQUESTER_NAME,
      pe.EMPCODE AS REQUESTER_EMPCODE,
      pe.DEPT AS REQUESTER_DEPT,
      pe.DESIG AS REQUESTER_DESIG,
      ob.BOOKEDBY,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY,
      ob.NOOFPEOPLE,
      ob.UNITPRICE,
      ob.HANDLINGCHARGE,
      ob.TOTALAMOUNT,
      ob.APPRLVL,
      ob.APPROVERID,
      u_appr.FULLNAME AS APPROVER_NAME,
      pe_appr.DESIG AS APPROVER_DESIG,
      pe_appr.DEPT AS APPROVER_DEPT,
      ob.STATUSID,
      st.STATUSNAME,
      st.STATUSCODE,
      ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    JOIN CMS_USER u_appr ON u_appr.USERID = ob.APPROVERID
    JOIN CMS_CUSTOMER cust_appr ON cust_appr.USERID = u_appr.USERID
    LEFT JOIN CMS_PERMEMP pe_appr ON pe_appr.CUSTOMERID = cust_appr.CUSTOMERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.OFFBOOKID = ?
    `,
    [bookingId]
  );

  const booking = rows[0];
  if (!booking) {
    throw new NotFoundError("Official Booking not found");
  }

  // Fetch Combo Items
  const [items] = await pool.query(
    `
    SELECT 
      oci.COMBOITEMID,
      oci.MENUITEMID,
      mi.ITEMNAME AS MENUNAME,
      mi.ITEMNAME,
      mi.SHORTNAME,
      COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
      oci.QTY,
      COALESCE(
        (SELECT d.PRICE 
         FROM CMS_ITEMPRICE p
         JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
         WHERE p.MENUITEMID = mi.MENUITEMID 
           AND d.CTYPECODE = 'OFF'
           AND p.STATUSID = 10
         ORDER BY p.EFFFROM DESC LIMIT 1), 
        0.00
      ) AS OFFPRICE
    FROM CMS_OFFCOMBO_ITEM oci
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE oci.OFFCOMBOID = ?
    ORDER BY mi.ITEMNAME ASC
    `,
    [booking.OFFCOMBOID]
  );

  // Fetch Approval Trail History
  const [history] = await pool.query(
    `
    SELECT 
      oa.OFFAPPRID,
      oa.ACTIONBY,
      u.FULLNAME AS ACTIONBY_NAME,
      oa.ACTIONROLE,
      oa.ACTION,
      oa.REJREASON,
      oa.ACTIONAT
    FROM CMS_OFFAPPR oa
    JOIN CMS_USER u ON u.USERID = oa.ACTIONBY
    WHERE oa.OFFBOOKID = ?
    ORDER BY oa.OFFAPPRID ASC
    `,
    [bookingId]
  );

  booking.ITEMS = items;
  booking.HISTORY = history;

  return booking;
};

export const listMyOfficialBookings = async (customerId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      ob.OFFBOOKID,
      ob.BOOKNO,
      c.CANTEENNAME,
      os.SERVNAME,
      os.REQAPPRLVL,
      oc.COMBONAME,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY,
      ob.NOOFPEOPLE,
      ob.UNITPRICE,
      ob.HANDLINGCHARGE,
      ob.TOTALAMOUNT,
      u_appr.FULLNAME AS APPROVER_NAME,
      ob.STATUSID,
      st.STATUSNAME,
      st.STATUSCODE,
      ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_appr ON u_appr.USERID = ob.APPROVERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.CUSTOMERID = ?
    ORDER BY ob.OFFBOOKID DESC
    `,
    [customerId]
  );
  return rows;
};

// ============================================================
// 4. APPROVER WORKFLOW
// ============================================================

export const listAssignedApprovals = async (approverUserId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      ob.OFFBOOKID,
      ob.BOOKNO,
      c.CANTEENNAME,
      os.SERVNAME,
      os.REQAPPRLVL,
      oc.COMBONAME,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY,
      ob.NOOFPEOPLE,
      ob.UNITPRICE,
      ob.HANDLINGCHARGE,
      ob.TOTALAMOUNT,
      u_emp.FULLNAME AS REQUESTER_NAME,
      pe.DEPT AS REQUESTER_DEPT,
      pe.DESIG AS REQUESTER_DESIG,
      ob.STATUSID,
      st.STATUSNAME,
      st.STATUSCODE,
      ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.APPROVERID = ?
      AND ob.STATUSID = ?
    ORDER BY ob.OFFBOOKID ASC
    `,
    [approverUserId, STATUS.SUBMITTED]
  );
  return rows;
};

export const processApproverAction = async ({ bookingId, action, rejReason, approverUserId }) => {
  return await withTransaction(async (conn) => {
    // 1. Lock and verify booking
    const [rows] = await conn.query(
      `SELECT OFFBOOKID, APPROVERID, STATUSID FROM CMS_OFFBOOK WHERE OFFBOOKID = ? FOR UPDATE`,
      [bookingId]
    );

    const booking = rows[0];
    if (!booking) {
      throw new NotFoundError("Official Booking not found");
    }

    if (Number(booking.APPROVERID) !== Number(approverUserId)) {
      throw new ForbiddenError("You are not the designated approver for this booking");
    }

    if (booking.STATUSID !== STATUS.SUBMITTED) {
      throw new BadRequestError("This booking is no longer pending approver action");
    }

    const nextStatus = action === "APPROVE" ? STATUS.PENDING_MANAGER : STATUS.REJECTED;
    const actionLabel = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // 2. Update booking status
    await conn.query(
      `UPDATE CMS_OFFBOOK SET STATUSID = ?, UPDATEDBY = ? WHERE OFFBOOKID = ?`,
      [nextStatus, approverUserId, bookingId]
    );

    // 3. Record audit trail
    await conn.query(
      `
      INSERT INTO CMS_OFFAPPR (OFFBOOKID, ACTIONBY, ACTIONROLE, ACTION, REJREASON)
      VALUES (?, ?, 'APPROVER', ?, ?)
      `,
      [bookingId, approverUserId, actionLabel, rejReason || null]
    );

    logger.info({ bookingId, action, approverUserId }, "Approver processed official booking");

    return {
      OFFBOOKID: bookingId,
      ACTION: actionLabel,
      STATUSID: nextStatus,
    };
  });
};

// ============================================================
// 5. CANTEEN MANAGER WORKFLOW
// ============================================================

export const listManagerPendingBookings = async (canteenId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      ob.OFFBOOKID,
      ob.BOOKNO,
      c.CANTEENNAME,
      os.SERVNAME,
      os.REQAPPRLVL,
      oc.COMBONAME,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY,
      ob.NOOFPEOPLE,
      ob.UNITPRICE,
      ob.HANDLINGCHARGE,
      ob.TOTALAMOUNT,
      u_emp.FULLNAME AS REQUESTER_NAME,
      pe.DEPT AS REQUESTER_DEPT,
      u_appr.FULLNAME AS APPROVER_NAME,
      ob.STATUSID,
      st.STATUSNAME,
      st.STATUSCODE,
      ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    JOIN CMS_USER u_appr ON u_appr.USERID = ob.APPROVERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.CANTEENID = ?
      AND ob.STATUSID = ?
    ORDER BY ob.EVENTDATETIME ASC
    `,
    [canteenId, STATUS.PENDING_MANAGER]
  );
  return rows;
};

export const processManagerAction = async ({ bookingId, action, rejReason, managerUserId, canteenRoles }) => {
  return await withTransaction(async (conn) => {
    // 1. Lock and verify booking
    const [rows] = await conn.query(
      `SELECT OFFBOOKID, CANTEENID, STATUSID FROM CMS_OFFBOOK WHERE OFFBOOKID = ? FOR UPDATE`,
      [bookingId]
    );

    const booking = rows[0];
    if (!booking) {
      throw new NotFoundError("Official Booking not found");
    }

    // Check manager canteen authorization
    const isAuthorized = (canteenRoles || []).some(
      (r) => r.CANTEENID === booking.CANTEENID && r.ROLECODE === "CNTMGR"
    );
    if (!isAuthorized) {
      throw new ForbiddenError("You are not authorized to manage bookings for this canteen");
    }

    if (booking.STATUSID !== STATUS.PENDING_MANAGER) {
      throw new BadRequestError("This booking is not awaiting Canteen Manager confirmation");
    }

    const nextStatus = action === "ACCEPT" ? STATUS.CONFIRMED : STATUS.REJECTED;
    const actionLabel = action === "ACCEPT" ? "CONFIRMED" : "REJECTED";

    // 2. Update booking status
    await conn.query(
      `UPDATE CMS_OFFBOOK SET STATUSID = ?, UPDATEDBY = ? WHERE OFFBOOKID = ?`,
      [nextStatus, managerUserId, bookingId]
    );

    // 3. Record audit trail
    await conn.query(
      `
      INSERT INTO CMS_OFFAPPR (OFFBOOKID, ACTIONBY, ACTIONROLE, ACTION, REJREASON)
      VALUES (?, ?, 'CANTEEN_MANAGER', ?, ?)
      `,
      [bookingId, managerUserId, actionLabel, rejReason || null]
    );

    logger.info({ bookingId, action, managerUserId }, "Canteen manager processed official booking");

    return {
      OFFBOOKID: bookingId,
      ACTION: actionLabel,
      STATUSID: nextStatus,
    };
  });
};

// ============================================================
// 6. RESUBMISSION (EMPLOYEE)
// ============================================================

export const resubmitOfficialBooking = async (bookingId, updatedData, user) => {
  return await withTransaction(async (conn) => {
    const [rows] = await conn.query(
      `
      SELECT 
        ob.OFFBOOKID, ob.BOOKEDBY, ob.OFFSERVID, ob.OFFCOMBOID, ob.QUANTITY, ob.STATUSID,
        os.CUTOFFHOURS, os.SERVNAME, os.REQAPPRLVL
      FROM CMS_OFFBOOK ob
      JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
      WHERE ob.OFFBOOKID = ?
      FOR UPDATE
      `,
      [bookingId]
    );

    const booking = rows[0];
    if (!booking) {
      throw new NotFoundError("Official Booking not found");
    }

    if (Number(booking.BOOKEDBY) !== Number(user.USERID)) {
      throw new ForbiddenError("You can only resubmit your own bookings");
    }

    if (booking.STATUSID !== STATUS.REJECTED) {
      throw new BadRequestError("Only rejected bookings can be modified and resubmitted");
    }

    // New values or existing fallbacks
    const newEventTimeStr = updatedData.EVENTDATETIME || booking.EVENTDATETIME;
    const newApproverId = updatedData.APPROVERID || booking.APPROVERID;
    const newComboId = updatedData.OFFCOMBOID || booking.OFFCOMBOID;
    const newQty = updatedData.QUANTITY !== undefined ? Number(updatedData.QUANTITY) : Number(booking.QUANTITY);

    // Self-approval prevention
    if (Number(newApproverId) === Number(user.USERID)) {
      throw new BadRequestError("Self-approval is not allowed. Please select another eligible approver.");
    }

    // Verify approver tier
    const [apprRows] = await conn.query(
      `
      SELECT lm.APPRLVL
      FROM CMS_USER u
      JOIN CMS_CUSTOMER c ON c.USERID = u.USERID
      JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
      JOIN CMS_LVLMAP lm ON lm.EMPLEVEL = pe.LEVEL AND lm.ISACTIVE = 1
      WHERE u.USERID = ? AND u.ISACTIVE = 1 AND c.STATUSID = 10
      `,
      [newApproverId]
    );
    const approverTier = apprRows[0]?.APPRLVL;
    if (!approverTier) {
      throw new BadRequestError("Selected approver is not mapped to an active approval level");
    }
    if (booking.REQAPPRLVL === "L2" && approverTier !== "L2") {
      throw new BadRequestError("This service requires Level 2 approval. You must select a Level 2 approver.");
    }

    // Cutoff validation
    const eventDateTimeIST = toMySQLDateTime(newEventTimeStr);
    const eventTime = dayjs.tz(eventDateTimeIST, TIMEZONE_IST).valueOf();
    const leadTimeHours = (eventTime - getNowIST().valueOf()) / (1000 * 60 * 60);
    if (leadTimeHours < booking.CUTOFFHOURS) {
      throw new BadRequestError(
        `Booking cutoff violation: ${booking.SERVNAME} requires at least ${booking.CUTOFFHOURS} hours notice prior to event.`
      );
    }

    // Price recalculation: Total = (Quantity * Gross Price) + Handling Charges
    const [comboRows] = await conn.query(
      `SELECT GROSSPRICE, HANDLINGCHARGE, COMBOPRICE FROM CMS_OFFCOMBO WHERE OFFCOMBOID = ?`,
      [newComboId]
    );
    const combo = comboRows[0];
    const grossUnitPrice = Number(combo?.GROSSPRICE !== undefined && combo?.GROSSPRICE !== null ? combo.GROSSPRICE : combo?.COMBOPRICE || 0);
    const handlingCharge = Number(combo?.HANDLINGCHARGE || 0);
    const totalAmount = Number(((newQty * grossUnitPrice) + handlingCharge).toFixed(2));

    const fields = [
      "STATUSID = ?",
      "UNITPRICE = ?",
      "HANDLINGCHARGE = ?",
      "TOTALAMOUNT = ?",
      "UPDATEDBY = ?",
    ];
    const params = [STATUS.SUBMITTED, grossUnitPrice, handlingCharge, totalAmount, user.USERID];

    if (updatedData.OFFCOMBOID) {
      fields.push("OFFCOMBOID = ?");
      params.push(updatedData.OFFCOMBOID);
    }
    if (updatedData.PURPOSE) {
      fields.push("PURPOSE = ?");
      params.push(updatedData.PURPOSE);
    }
    if (updatedData.VENUE) {
      fields.push("VENUE = ?");
      params.push(updatedData.VENUE);
    }
    if (updatedData.EVENTDATETIME) {
      fields.push("EVENTDATETIME = ?");
      params.push(toMySQLDateTime(updatedData.EVENTDATETIME));
    }
    if (updatedData.QUANTITY) {
      fields.push("QUANTITY = ?");
      params.push(updatedData.QUANTITY);
    }
    if (updatedData.NOOFPEOPLE) {
      fields.push("NOOFPEOPLE = ?");
      params.push(updatedData.NOOFPEOPLE);
    }
    if (updatedData.APPRLVL || approverTier) {
      fields.push("APPRLVL = ?");
      params.push(updatedData.APPRLVL || approverTier);
    }
    if (updatedData.APPROVERID) {
      fields.push("APPROVERID = ?");
      params.push(updatedData.APPROVERID);
    }

    params.push(bookingId);

    await conn.query(`UPDATE CMS_OFFBOOK SET ${fields.join(", ")} WHERE OFFBOOKID = ?`, params);

    // Record resubmission in audit history
    await conn.query(
      `
      INSERT INTO CMS_OFFAPPR (OFFBOOKID, ACTIONBY, ACTIONROLE, ACTION, REJREASON)
      VALUES (?, ?, 'EMPLOYEE', 'RESUBMITTED', 'Request modified and resubmitted')
      `,
      [bookingId, user.USERID]
    );

    logger.info({ bookingId, userId: user.USERID }, "Official booking resubmitted");

    return getOfficialBookingById(bookingId);
  });
};

// ============================================================
// 7. KITCHEN PREPARATION & CONFIRMED ORDERS FULFILLMENT
// ============================================================

export const listConfirmedOfficialBookings = async (canteenId, { date, fromDate, toDate } = {}) => {
  let dateFilter = "";
  const params = [canteenId, STATUS.CONFIRMED];

  if (date) {
    dateFilter = "AND DATE(ob.EVENTDATETIME) = ?";
    params.push(date);
  } else if (fromDate && toDate) {
    dateFilter = "AND DATE(ob.EVENTDATETIME) BETWEEN ? AND ?";
    params.push(fromDate, toDate);
  }

  const [bookings] = await pool.query(
    `
    SELECT 
      ob.OFFBOOKID,
      ob.BOOKNO,
      ob.CANTEENID,
      c.CANTEENNAME,
      ob.OFFSERVID,
      os.SERVNAME,
      os.REQAPPRLVL,
      ob.OFFCOMBOID,
      oc.COMBONAME,
      oc.GROSSPRICE,
      oc.HANDLINGCHARGE AS COMBO_HANDLINGCHARGE,
      ob.CUSTOMERID,
      u_emp.FULLNAME AS REQUESTER_NAME,
      u_emp.FULLNAME AS REQ_NAME,
      u_emp.MOBILENO AS REQUESTER_PHONE,
      u_emp.MOBILENO AS REQ_PHONE,
      pe.EMPCODE AS REQUESTER_EMPCODE,
      pe.DEPT AS REQUESTER_DEPT,
      pe.DEPT AS DEPTNAME,
      pe.DESIG AS REQUESTER_DESIG,
      ob.BOOKEDBY,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY,
      ob.NOOFPEOPLE,
      ob.UNITPRICE,
      ob.HANDLINGCHARGE,
      ob.TOTALAMOUNT,
      ob.APPRLVL,
      ob.APPROVERID,
      u_appr.FULLNAME AS APPROVER_NAME,
      pe_appr.DESIG AS APPROVER_DESIG,
      ob.STATUSID,
      st.STATUSNAME,
      st.STATUSCODE,
      ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    JOIN CMS_USER u_appr ON u_appr.USERID = ob.APPROVERID
    LEFT JOIN CMS_CUSTOMER cust_appr ON cust_appr.USERID = u_appr.USERID
    LEFT JOIN CMS_PERMEMP pe_appr ON pe_appr.CUSTOMERID = cust_appr.CUSTOMERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.CANTEENID = ?
      AND ob.STATUSID = ?
      ${dateFilter}
    ORDER BY ob.EVENTDATETIME ASC
    `,
    params
  );

  if (!bookings || bookings.length === 0) {
    return [];
  }

  // Fetch combo items for each booking to know exact packing contents
  const comboIds = [...new Set(bookings.map((b) => b.OFFCOMBOID))];
  const [items] = await pool.query(
    `
    SELECT 
      oci.OFFCOMBOID,
      oci.COMBOITEMID,
      oci.MENUITEMID,
      mi.ITEMNAME AS MENUNAME,
      mi.ITEMNAME,
      mi.SHORTNAME,
      COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
      oci.QTY,
      COALESCE(
        (SELECT d.PRICE 
         FROM CMS_ITEMPRICE p
         JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
         WHERE p.MENUITEMID = mi.MENUITEMID 
           AND d.CTYPECODE = 'OFF'
           AND p.STATUSID = 10
         ORDER BY p.EFFFROM DESC LIMIT 1), 
        0.00
      ) AS OFFPRICE
    FROM CMS_OFFCOMBO_ITEM oci
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE oci.OFFCOMBOID IN (?)
    ORDER BY mi.ITEMNAME ASC
    `,
    [comboIds]
  );

  const itemsByCombo = {};
  for (const it of items) {
    if (!itemsByCombo[it.OFFCOMBOID]) {
      itemsByCombo[it.OFFCOMBOID] = [];
    }
    itemsByCombo[it.OFFCOMBOID].push(it);
  }

  return bookings.map((b) => {
    const comboItems = itemsByCombo[b.OFFCOMBOID] || [];
    return {
      ...b,
      ITEMS: comboItems.map((ci) => ({
        ...ci,
        TOTAL_PREP_QTY: Number(ci.QTY || 1) * Number(b.QUANTITY || 1),
      })),
    };
  });
};

export const getOfficialKitchenPrepSummary = async (canteenId, targetDate) => {
  // 1. Aggregated dish quantities needed
  const [dishRows] = await pool.query(
    `
    SELECT 
      mi.MENUITEMID,
      mi.MENUITEMID AS ITEMID,
      mi.ITEMNAME AS MENUNAME,
      mi.ITEMNAME,
      mi.SHORTNAME,
      COALESCE(s.SERVNAME, mi.SHORTNAME, 'General') AS CATCODE,
      COALESCE(s.SERVNAME, 'General') AS CATNAME,
      SUM(oci.QTY * ob.QUANTITY) AS TOTAL_PREP_QTY,
      COUNT(DISTINCT ob.OFFBOOKID) AS ORDER_COUNT,
      COUNT(DISTINCT ob.OFFBOOKID) AS TOTAL_ORDERS_COUNT
    FROM CMS_OFFBOOK ob
    JOIN CMS_OFFCOMBO_ITEM oci ON oci.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE ob.CANTEENID = ?
      AND ob.STATUSID = ?
      AND DATE(ob.EVENTDATETIME) = ?
    GROUP BY mi.MENUITEMID, mi.ITEMNAME, mi.SHORTNAME, s.SERVNAME
    ORDER BY CATCODE ASC, mi.ITEMNAME ASC
    `,
    [canteenId, STATUS.CONFIRMED, targetDate]
  );

  // 2. Order breakdown for each dish (which booking needs how much)
  const [breakdownRows] = await pool.query(
    `
    SELECT 
      oci.MENUITEMID,
      ob.OFFBOOKID,
      ob.BOOKNO,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY AS BOOKING_SERVINGS,
      oci.QTY AS COMBO_ITEM_QTY,
      (oci.QTY * ob.QUANTITY) AS PREP_QTY,
      u_emp.FULLNAME AS REQUESTER_NAME,
      u_emp.MOBILENO AS REQUESTER_PHONE,
      pe.EMPCODE AS REQUESTER_EMPCODE,
      pe.DEPT AS REQUESTER_DEPT,
      pe.DESIG AS REQUESTER_DESIG
    FROM CMS_OFFBOOK ob
    JOIN CMS_OFFCOMBO_ITEM oci ON oci.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    WHERE ob.CANTEENID = ?
      AND ob.STATUSID = ?
      AND DATE(ob.EVENTDATETIME) = ?
    ORDER BY ob.EVENTDATETIME ASC
    `,
    [canteenId, STATUS.CONFIRMED, targetDate]
  );

  const breakdownByDish = {};
  for (const row of breakdownRows) {
    if (!breakdownByDish[row.MENUITEMID]) {
      breakdownByDish[row.MENUITEMID] = [];
    }
    breakdownByDish[row.MENUITEMID].push(row);
  }

  // 3. Overall day stats
  const [statsRows] = await pool.query(
    `
    SELECT 
      COUNT(DISTINCT ob.OFFBOOKID) AS TOTAL_EVENTS,
      COALESCE(SUM(ob.QUANTITY), 0) AS TOTAL_SERVINGS,
      COALESCE(SUM(ob.NOOFPEOPLE), 0) AS TOTAL_ATTENDEES,
      MIN(ob.EVENTDATETIME) AS EARLIEST_EVENT
    FROM CMS_OFFBOOK ob
    WHERE ob.CANTEENID = ?
      AND ob.STATUSID = ?
      AND DATE(ob.EVENTDATETIME) = ?
    `,
    [canteenId, STATUS.CONFIRMED, targetDate]
  );

  const dishesWithOrders = dishRows.map((d) => ({
    ...d,
    ITEMID: d.MENUITEMID,
    TOTAL_PREP_QTY: Number(d.TOTAL_PREP_QTY || 0),
    ORDER_COUNT: Number(d.ORDER_COUNT || 0),
    TOTAL_ORDERS_COUNT: Number(d.ORDER_COUNT || 0),
    ORDERS: breakdownByDish[d.MENUITEMID] || [],
  }));

  const totalEvents = Number(statsRows[0]?.TOTAL_EVENTS || 0);
  const totalServings = Number(statsRows[0]?.TOTAL_SERVINGS || 0);

  return {
    DATE: targetDate,
    TARGETDATE: targetDate,
    CANTEENID: Number(canteenId),
    TOTAL_BOOKINGS: totalEvents,
    TOTAL_PAX: totalServings,
    SUMMARY: statsRows[0] || {
      TOTAL_EVENTS: 0,
      TOTAL_SERVINGS: 0,
      TOTAL_ATTENDEES: 0,
      EARLIEST_EVENT: null,
    },
    DISHES: dishesWithOrders,
  };
};

// ============================================================
// CANTEEN & ENTITY RESOLUTION HELPERS (FOR RBAC & AUTHORIZATION)
// ============================================================

export const getCanteenIdByServiceId = async (serviceId) => {
  const id = Number(serviceId);
  if (!id) return null;
  const [rows] = await pool.query(
    "SELECT CANTEENID FROM CMS_OFFSERV WHERE OFFSERVID = ?",
    [id]
  );
  return rows[0]?.CANTEENID || null;
};

export const getCanteenIdByComboId = async (comboId) => {
  const id = Number(comboId);
  if (!id) return null;
  const [rows] = await pool.query(
    "SELECT os.CANTEENID FROM CMS_OFFCOMBO oc JOIN CMS_OFFSERV os ON os.OFFSERVID = oc.OFFSERVID WHERE oc.OFFCOMBOID = ?",
    [id]
  );
  return rows[0]?.CANTEENID || null;
};

export const getCanteenIdByBookingId = async (bookingId) => {
  const id = Number(bookingId);
  if (!id) return null;
  const [rows] = await pool.query(
    "SELECT CANTEENID FROM CMS_OFFBOOK WHERE OFFBOOKID = ?",
    [id]
  );
  return rows[0]?.CANTEENID || null;
};

export const getServiceById = async (serviceId) => {
  const [rows] = await pool.query(
    `SELECT os.*, c.CANTEENNAME, st.STATUSNAME
     FROM CMS_OFFSERV os
     JOIN CMS_CANTEEN c ON c.CANTEENID = os.CANTEENID
     JOIN CMS_STATUS st ON st.STATUSID = os.STATUSID
     WHERE os.OFFSERVID = ?`,
    [serviceId]
  );
  return rows[0] || null;
};

export const getComboById = async (comboId) => {
  const [rows] = await pool.query(
    `SELECT oc.*, os.CANTEENID, st.STATUSNAME
     FROM CMS_OFFCOMBO oc
     JOIN CMS_OFFSERV os ON os.OFFSERVID = oc.OFFSERVID
     JOIN CMS_STATUS st ON st.STATUSID = oc.STATUSID
     WHERE oc.OFFCOMBOID = ?`,
    [comboId]
  );
  return rows[0] || null;
};

export const getBookingHeaderById = async (bookingId) => {
  const [rows] = await pool.query(
    `SELECT b.*, st.STATUSCODE, st.STATUSNAME, c.CANTEENNAME, os.SERVNAME
     FROM CMS_OFFBOOK b
     JOIN CMS_STATUS st ON st.STATUSID = b.STATUSID
     JOIN CMS_CANTEEN c ON c.CANTEENID = b.CANTEENID
     JOIN CMS_OFFSERV os ON os.OFFSERVID = b.OFFSERVID
     WHERE b.OFFBOOKID = ?`,
    [bookingId]
  );
  return rows[0] || null;
};

