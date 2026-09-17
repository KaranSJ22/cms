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
      oc.COMBOPRICE,
      oc.STATUSID,
      st.STATUSNAME
    FROM CMS_OFFCOMBO oc
    JOIN CMS_STATUS st ON st.STATUSID = oc.STATUSID
    WHERE oc.OFFSERVID IN (?)
    ORDER BY oc.OFFCOMBOID ASC
    `,
    [serviceIds]
  );

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
        COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
        oci.QTY
      FROM CMS_OFFCOMBO_ITEM oci
      JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
      LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
      WHERE oci.OFFCOMBOID IN (?)
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
  const { CANTEENID, SERVNAME, DESCR, CUTOFFHOURS } = serviceData;

  const [result] = await pool.query(
    `
    INSERT INTO CMS_OFFSERV (CANTEENID, SERVNAME, DESCR, CUTOFFHOURS, STATUSID, CREATEDBY)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [CANTEENID, SERVNAME, DESCR || null, CUTOFFHOURS || 24, STATUS.ACTIVE, userId]
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
  const { OFFSERVID, COMBONAME, DESCR, COMBOPRICE, ITEMS } = comboData;

  return await withTransaction(async (conn) => {
    // 1. Insert combo header
    const [comboRes] = await conn.query(
      `
      INSERT INTO CMS_OFFCOMBO (OFFSERVID, COMBONAME, DESCR, COMBOPRICE, STATUSID, CREATEDBY)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [OFFSERVID, COMBONAME, DESCR || null, COMBOPRICE, STATUS.ACTIVE, userId]
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
        (SELECT d.PRICE 
         FROM CMS_ITEMPRICE p
         JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
         WHERE p.MENUITEMID = mi.MENUITEMID 
           AND p.STATUSID = 10
         ORDER BY (d.CTYPECODE = 'PRM') DESC, p.EFFFROM DESC LIMIT 1),
        0.00
      ) AS UNITPRICE,
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
    WHERE mi.STATUSID = 10
    ORDER BY mi.OFFSER DESC, mi.ITEMNAME ASC
    `
  );
  return rows;
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

const generateOfficialBookingNumber = async (canteenId, serviceId, conn) => {
  // Get canteen code
  const [cantRows] = await conn.query(
    `SELECT CANTEENCODE FROM CMS_CANTEEN WHERE CANTEENID = ?`,
    [canteenId]
  );
  const canteenCode = cantRows[0]?.CANTEENCODE || "CAN";

  // Lock counter record
  await conn.query(
    `
    INSERT INTO CMS_OFFBOOKCTR (CANTEENID, OFFSERVID, LASTNO)
    VALUES (?, ?, 0)
    ON DUPLICATE KEY UPDATE LASTNO = LASTNO
    `,
    [canteenId, serviceId]
  );

  const [ctrRows] = await conn.query(
    `
    SELECT LASTNO 
    FROM CMS_OFFBOOKCTR 
    WHERE CANTEENID = ? AND OFFSERVID = ?
    FOR UPDATE
    `,
    [canteenId, serviceId]
  );

  const nextSeq = (ctrRows[0]?.LASTNO || 0) + 1;

  await conn.query(
    `UPDATE CMS_OFFBOOKCTR SET LASTNO = ? WHERE CANTEENID = ? AND OFFSERVID = ?`,
    [nextSeq, canteenId, serviceId]
  );

  const year = getCurrentYearIST();
  const padded = String(nextSeq).padStart(4, "0");
  return `OBK-${canteenCode}-${year}-${padded}`;
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

  // 3. Check service and cutoff
  const [svcRows] = await pool.query(
    `SELECT OFFSERVID, SERVNAME, CUTOFFHOURS, STATUSID FROM CMS_OFFSERV WHERE OFFSERVID = ?`,
    [OFFSERVID]
  );
  const service = svcRows[0];
  if (!service || service.STATUSID !== STATUS.ACTIVE) {
    throw new BadRequestError("The requested Official Service is not active or does not exist");
  }

  const eventDateTimeIST = toMySQLDateTime(EVENTDATETIME);
  const eventTime = dayjs.tz(eventDateTimeIST, TIMEZONE_IST).valueOf();
  const leadTimeHours = (eventTime - getNowIST().valueOf()) / (1000 * 60 * 60);

  if (leadTimeHours < service.CUTOFFHOURS) {
    throw new BadRequestError(
      `Booking cutoff violation: ${service.SERVNAME} requires at least ${service.CUTOFFHOURS} hours notice prior to the event.`
    );
  }

  // 4. Validate combo and price
  const [comboRows] = await pool.query(
    `SELECT OFFCOMBOID, COMBONAME, COMBOPRICE, STATUSID FROM CMS_OFFCOMBO WHERE OFFCOMBOID = ? AND OFFSERVID = ?`,
    [OFFCOMBOID, OFFSERVID]
  );
  const combo = comboRows[0];
  if (!combo || combo.STATUSID !== STATUS.ACTIVE) {
    throw new BadRequestError("The selected combo is not active or does not belong to this service");
  }

  const unitPrice = Number(combo.COMBOPRICE);
  const totalAmount = unitPrice * Number(QUANTITY);

  // 5. Execute transactional insert
  return await withTransaction(async (conn) => {
    const bookNo = await generateOfficialBookingNumber(CANTEENID, OFFSERVID, conn);

    const [insRes] = await conn.query(
      `
      INSERT INTO CMS_OFFBOOK (
        BOOKNO, CANTEENID, OFFSERVID, OFFCOMBOID, CUSTOMERID, BOOKEDBY,
        PURPOSE, VENUE, EVENTDATETIME, QUANTITY, NOOFPEOPLE,
        UNITPRICE, TOTALAMOUNT, APPRLVL, APPROVERID, STATUSID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        unitPrice,
        totalAmount,
        APPRLVL,
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
      ob.OFFCOMBOID,
      oc.COMBONAME,
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
      COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
      oci.QTY
    FROM CMS_OFFCOMBO_ITEM oci
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE oci.OFFCOMBOID = ?
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
      oc.COMBONAME,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY,
      ob.NOOFPEOPLE,
      ob.UNITPRICE,
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
      oc.COMBONAME,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY,
      ob.NOOFPEOPLE,
      ob.UNITPRICE,
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
      oc.COMBONAME,
      ob.PURPOSE,
      ob.VENUE,
      ob.EVENTDATETIME,
      ob.QUANTITY,
      ob.NOOFPEOPLE,
      ob.UNITPRICE,
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
        ob.OFFBOOKID, ob.BOOKEDBY, ob.OFFSERVID, ob.OFFCOMBOID, ob.STATUSID,
        os.CUTOFFHOURS, os.SERVNAME
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

    // Self-approval prevention
    if (Number(newApproverId) === Number(user.USERID)) {
      throw new BadRequestError("Self-approval is not allowed. Please select another eligible approver.");
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

    // Price recalculation
    const [comboRows] = await conn.query(
      `SELECT COMBOPRICE FROM CMS_OFFCOMBO WHERE OFFCOMBOID = ?`,
      [newComboId]
    );
    const unitPrice = Number(comboRows[0]?.COMBOPRICE || 0);

    const fields = [
      "STATUSID = ?",
      "UNITPRICE = ?",
      "UPDATEDBY = ?",
    ];
    const params = [STATUS.SUBMITTED, unitPrice, user.USERID];

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
      fields.push("TOTALAMOUNT = ?");
      params.push(unitPrice * Number(updatedData.QUANTITY));
    }
    if (updatedData.NOOFPEOPLE) {
      fields.push("NOOFPEOPLE = ?");
      params.push(updatedData.NOOFPEOPLE);
    }
    if (updatedData.APPRLVL) {
      fields.push("APPRLVL = ?");
      params.push(updatedData.APPRLVL);
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
