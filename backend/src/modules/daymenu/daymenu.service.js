import {
  getDayMenuWorkspace,
  replaceDayMenuItems,
  submitDayMenu as submitDayMenuRepo,
  approveDayMenu as approveDayMenuRepo,
  rejectDayMenu as rejectDayMenuRepo,
  listPendingDayMenus,
  viewPublishedMenu,
  getDayMenuById as getDayMenuByIdRepo,
} from "./daymenu.repository.js";
import { pool } from "../../db/connection.js";
import { toMySQLDateTime, addDaysIST } from "../../utils/dateTime.js";
import { BadRequestError, ForbiddenError } from "../../common/errors/appError.js";

// Canonical Status & Approval State IDs (matching CMS_STATUS)
const STATUS_ACTIVE = 10;
const APPR_STATUS_DRAFT = 20;
const APPR_STATUS_PENDING = 21;
const APPR_STATUS_APPROVED = 22;
const APPR_STATUS_REJECTED = 23;

export const getWorkspace = async (DAYSLOTID) => {
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const updateMenuItems = async (DAYSLOTID, ITEMSJSON, CHANGEDBY, REMARKS = null) => {
  await replaceDayMenuItems({ DAYSLOTID, ITEMSJSON, CHANGEDBY, REMARKS });
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const submitDayMenu = async (DAYSLOTID, SUBMITTEDBY) => {
  await submitDayMenuRepo({ DAYSLOTID, SUBMITTEDBY });
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const approveDayMenu = async (DAYSLOTID, remarks, APPROVEDBY) => {
  await approveDayMenuRepo({ DAYSLOTID, APPROVEDBY, REMARKS: remarks });
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const rejectDayMenu = async (DAYSLOTID, remarks, REJECTEDBY) => {
  await rejectDayMenuRepo({ DAYSLOTID, REJECTEDBY, REMARKS: remarks });
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const fetchPendingDayMenus = async (CANTEENID) => {
  const pending = await listPendingDayMenus(CANTEENID);
  if (!pending || pending.length === 0) return [];

  const slotIds = pending.map((s) => s.DAYSLOTID);
  try {
    const [items] = await pool.execute(
      `SELECT DM.DAYSLOTID, COUNT(DM.DAYMENUID) AS ITEMCOUNT,
              GROUP_CONCAT(MI.ITEMNAME ORDER BY DM.ISBASE DESC, MI.ITEMNAME SEPARATOR ', ') AS ITEMSNAMES
       FROM CMS_DAYMENU DM
       JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
       WHERE DM.DAYSLOTID IN (${slotIds.map(() => '?').join(',')})
       GROUP BY DM.DAYSLOTID`,
      slotIds
    );

    const itemMap = new Map((items || []).map((i) => [i.DAYSLOTID, i]));

    return pending.map((s) => ({
      ...s,
      SERVICEDATE: s.SERVICEDATE ? String(s.SERVICEDATE).substring(0, 10) : s.SERVDATE,
      SERVDATE: s.SERVICEDATE ? String(s.SERVICEDATE).substring(0, 10) : s.SERVDATE,
      ITEMCOUNT: itemMap.get(s.DAYSLOTID)?.ITEMCOUNT || 0,
      ITEMSNAMES: itemMap.get(s.DAYSLOTID)?.ITEMSNAMES || "",
    }));
  } catch (err) {
    console.error("Failed to enrich pending day menus with item preview:", err);
    return pending.map((s) => ({
      ...s,
      SERVICEDATE: s.SERVICEDATE ? String(s.SERVICEDATE).substring(0, 10) : s.SERVDATE,
      SERVDATE: s.SERVICEDATE ? String(s.SERVICEDATE).substring(0, 10) : s.SERVDATE,
    }));
  }
};

export const fetchPublishedMenu = async (canteenId, serviceDate, customerTypeCode) => {
  return await viewPublishedMenu({
    CANTEENID: canteenId,
    SERVDATE: serviceDate,
    CTYPECODE: customerTypeCode || "VIS",
  });
};

export const getDayMenuById = async (DAYMENUID) => {
  return await getDayMenuByIdRepo(DAYMENUID);
};

/**
 * Helper: resolves an auto-generated unique number from CMSGENAUTO within
 * an already-open connection (so it participates in the outer transaction).
 */
async function genAutoNo(conn, tableName, columnName) {
  await conn.execute(`CALL CMSGENAUTO(?, ?, @__autono)`, [tableName, columnName]);
  const [[row]] = await conn.execute(`SELECT @__autono AS AUTONO`);
  return row.AUTONO;
}

/**
 * Atomically creates Day Slots (upsert) and inserts Day Menu items for 7
 * consecutive days starting from `startDate`. Raw SQL staging in service.
 */
export const bulkCreateMenuForWeek = async ({
  canteenId,
  serviceId,
  startDate,
  startTime,
  endTime,
  days,
  createdBy,
  targetApprStatus = APPR_STATUS_APPROVED,
  action = "PUBLISH",
}) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const results = [];
    const totalDays = days.length || 5;

    for (let d = 0; d < totalDays; d++) {
      // ── 1. Compute SERVDATE for this iteration (timezone-safe) ─────────
      const servDateStr = addDaysIST(startDate, d);

      // ── Check if this date is an active holiday ─────────────────────────
      const [[holiday]] = await conn.execute(
        `SELECT HOLIDAYID, HOLIDAYNAME FROM CMS_HOLIDAY
          WHERE STATUSID = 10
            AND (
              HOLIDAYDATE = ?
              OR (ISRECURRING = 1 AND MONTH(HOLIDAYDATE) = MONTH(?) AND DAY(HOLIDAYDATE) = DAY(?))
            )
          LIMIT 1`,
        [servDateStr, servDateStr, servDateStr]
      );

      // Find the per-day config sent from the frontend
      const dayConfig = days.find((day) => day.DAYINDEX === d);

      if (holiday && !dayConfig?.OVERRIDEHOLIDAY) {
        results.push({
          date:          servDateStr,
          daySlotId:     null,
          slotNo:        null,
          isNewSlot:     false,
          itemsInserted: 0,
          skipped:       true,
          reason:        `Holiday: ${holiday.HOLIDAYNAME} (Canteen Closed)`,
        });
        continue;
      }

      const items = dayConfig?.ITEMS ?? [];

      // Per-day serving timings (supports day-to-day variance, falls back to bulk default)
      const dayStartTime = dayConfig?.STARTTIME || startTime;
      const dayEndTime   = dayConfig?.ENDTIME || endTime;

      // ── 2. Check if a Day Slot already exists for this canteen+service+date
      const [[existingSlot]] = await conn.execute(
        `SELECT DAYSLOTID, SLOTNO, STARTTIME, ENDTIME, STATUSID, APPRSTATUSID FROM CMS_DAYSLOT
          WHERE CANTEENID = ? AND SERVICEID = ? AND SERVICEDATE = ?`,
        [canteenId, serviceId, servDateStr]
      );

      let daySlotId;
      let slotNo;
      let isNewSlot = false;

      if (existingSlot) {
        // ── 3a. Slot already exists ──────────────────────────
        daySlotId = existingSlot.DAYSLOTID;
        slotNo    = existingSlot.SLOTNO;

        // Check if any bookings exist for this slot
        const [bookingCheck] = await conn.execute(
          `SELECT COUNT(*) AS bookingCount
           FROM CMS_BOOKITEM BI
           JOIN CMS_DAYMENU DM ON BI.DAYMENUID = DM.DAYMENUID
           WHERE DM.DAYSLOTID = ?`,
          [daySlotId]
        );
        const hasBookings = (bookingCheck[0]?.bookingCount || 0) > 0;

        // Only APPROVED slots or slots with existing bookings are strictly locked
        const isLocked = existingSlot.APPRSTATUSID === APPR_STATUS_APPROVED || hasBookings;

        if (isLocked) {
          let timingUpdated = false;
          // Only parent Day Slot timings can be adjusted (compare normalized HH:MM)
          const normStart = (dayStartTime || '').slice(0, 5);
          const normEnd   = (dayEndTime || '').slice(0, 5);
          const slotStart = (existingSlot.STARTTIME || '').slice(0, 5);
          const slotEnd   = (existingSlot.ENDTIME || '').slice(0, 5);

          if (normStart !== slotStart || normEnd !== slotEnd) {
            await conn.execute(
              `UPDATE CMS_DAYSLOT 
               SET STARTTIME = ?, ENDTIME = ?, UPDATEDAT = CURRENT_TIMESTAMP
               WHERE DAYSLOTID = ?`,
              [dayStartTime, dayEndTime, daySlotId]
            );

            await conn.execute(
              `INSERT INTO CMS_SLOTHIST
                (DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVICEDATE,
                 STARTTIME, ENDTIME, STATUSID, APPRSTATUSID, CHANGEDBY, CHGREASON)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bulk Timing Adjustment')`,
              [daySlotId, slotNo, serviceId, canteenId, servDateStr, dayStartTime, dayEndTime, existingSlot.STATUSID, existingSlot.APPRSTATUSID, createdBy]
            );
            timingUpdated = true;
          }

          results.push({
            date: servDateStr,
            daySlotId,
            slotNo,
            isNewSlot: false,
            itemsInserted: 0,
            timingUpdated,
            skipped: true,
            reason: timingUpdated
              ? "Day menu already published (items locked) — Day slot timing updated"
              : "Day menu already published — items and timings locked",
          });
          continue;
        }

        // Slot exists in DRAFT, PENDING, or REJECTED state (and has no bookings) -> update it!
        const normStart = (dayStartTime || '').slice(0, 5);
        const normEnd   = (dayEndTime || '').slice(0, 5);
        const slotStart = (existingSlot.STARTTIME || '').slice(0, 5);
        const slotEnd   = (existingSlot.ENDTIME || '').slice(0, 5);

        const submittedBy = (targetApprStatus === APPR_STATUS_PENDING || targetApprStatus === APPR_STATUS_APPROVED) ? createdBy : null;
        const submittedAt = (targetApprStatus === APPR_STATUS_PENDING || targetApprStatus === APPR_STATUS_APPROVED) ? new Date() : null;
        const approvedBy = (targetApprStatus === APPR_STATUS_APPROVED) ? createdBy : null;
        const approvedAt = (targetApprStatus === APPR_STATUS_APPROVED) ? new Date() : null;

        await conn.execute(
          `UPDATE CMS_DAYSLOT 
           SET STARTTIME = ?, ENDTIME = ?, APPRSTATUSID = ?,
               MENUSUBMITTEDBY = COALESCE(?, MENUSUBMITTEDBY),
               MENUSUBMITTEDAT = CASE WHEN ? IS NOT NULL THEN ? ELSE MENUSUBMITTEDAT END,
               MENUAPPROVEDBY = ?,
               MENUAPPROVEDAT = ?,
               UPDATEDAT = CURRENT_TIMESTAMP
           WHERE DAYSLOTID = ?`,
          [
            dayStartTime, dayEndTime, targetApprStatus,
            submittedBy,
            submittedBy, submittedAt,
            approvedBy,
            approvedAt,
            daySlotId
          ]
        );

        const changeReason = action === 'DRAFT'
          ? 'Bulk Draft Updated'
          : action === 'SUBMIT'
          ? 'Bulk Submitted for Approval'
          : 'Bulk Approved & Published';

        await conn.execute(
          `INSERT INTO CMS_SLOTHIST
            (DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVICEDATE,
             STARTTIME, ENDTIME, STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT,
             MENUAPPROVEDBY, MENUAPPROVEDAT, CHANGEDBY, CHGREASON)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            daySlotId, slotNo, serviceId, canteenId, servDateStr, dayStartTime, dayEndTime,
            STATUS_ACTIVE, targetApprStatus, submittedBy, submittedAt, approvedBy, approvedAt,
            createdBy, changeReason
          ]
        );

        // Delete unapproved draft items to replace with updated batch
        await conn.execute(`DELETE FROM CMS_DAYMENU WHERE DAYSLOTID = ?`, [daySlotId]);
      }

      // ── Skip unconfigured days that have no items ─────────────────────
      if (items.length === 0) {
        results.push({
          date:          servDateStr,
          daySlotId:     daySlotId || null,
          slotNo:        slotNo || null,
          isNewSlot:     false,
          itemsInserted: 0,
          skipped:       true,
          reason:        "No items configured",
        });
        continue;
      }

      // ── 3b. No slot — generate ID and create it ──────────────────────
      if (!existingSlot) {
        slotNo = await genAutoNo(conn, "CMS_DAYSLOT", "SLOTNO");

        const submittedBy = (targetApprStatus === APPR_STATUS_PENDING || targetApprStatus === APPR_STATUS_APPROVED) ? createdBy : null;
        const submittedAt = (targetApprStatus === APPR_STATUS_PENDING || targetApprStatus === APPR_STATUS_APPROVED) ? new Date() : null;
        const approvedBy = (targetApprStatus === APPR_STATUS_APPROVED) ? createdBy : null;
        const approvedAt = (targetApprStatus === APPR_STATUS_APPROVED) ? new Date() : null;

        const [insertSlotResult] = await conn.execute(
          `INSERT INTO CMS_DAYSLOT
            (SLOTNO, CANTEENID, SERVICEID, SERVICEDATE, STARTTIME, ENDTIME,
             STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT, MENUAPPROVEDBY, MENUAPPROVEDAT, CREATEDBY)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            slotNo, canteenId, serviceId, servDateStr, dayStartTime, dayEndTime,
            STATUS_ACTIVE, targetApprStatus, submittedBy, submittedAt, approvedBy, approvedAt, createdBy
          ]
        );
        daySlotId = insertSlotResult.insertId;

        const changeReason = action === 'DRAFT'
          ? 'Bulk Draft Creation'
          : action === 'SUBMIT'
          ? 'Bulk Creation - Submitted for Approval'
          : 'Bulk Creation - Approved & Published';

        // Initial audit history row
        await conn.execute(
          `INSERT INTO CMS_SLOTHIST
            (DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVICEDATE,
             STARTTIME, ENDTIME, STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT,
             MENUAPPROVEDBY, MENUAPPROVEDAT, CHANGEDBY, CHGREASON)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            daySlotId, slotNo, serviceId, canteenId, servDateStr, dayStartTime, dayEndTime,
            STATUS_ACTIVE, targetApprStatus, submittedBy, submittedAt, approvedBy, approvedAt,
            createdBy, changeReason
          ]
        );

        isNewSlot = true;
      }

      // ── 4. Insert each new menu item for this day slot ────────────────
      for (const item of items) {
        const dMenuNo = await genAutoNo(conn, "CMS_DAYMENU", "DMENUNO");

        const defaultCutoff = `${servDateStr} ${String(Math.max(0, parseInt(dayStartTime.split(':')[0], 10) - 1)).padStart(2, '0')}:${dayStartTime.split(':')[1] || '00'}:00`;
        const bookUntilVal = item.BOOKUNTIL ? toMySQLDateTime(item.BOOKUNTIL) : defaultCutoff;
        const cancelUntilVal = item.CANCELUNTIL ? toMySQLDateTime(item.CANCELUNTIL) : defaultCutoff;

        await conn.execute(
          `INSERT INTO CMS_DAYMENU
            (DMENUNO, DAYSLOTID, MENUITEMID, ISBASE, ISSPECIAL, ISPREBOOK,
             ISKIOSK, BOOKUNTIL, CANCELUNTIL, AVAILQTY, MAXQTY, STATUSID, CREATEDBY)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dMenuNo, daySlotId, item.MENUITEMID,
            item.ISBASE ?? 0, item.ISSPECIAL ?? 0,
            item.ISPREBOOK ?? 1, item.ISKIOSK ?? 1,
            bookUntilVal, cancelUntilVal,
            item.AVAILQTY ?? null, item.MAXQTY ?? 1,
            STATUS_ACTIVE,
            createdBy,
          ]
        );
      }

      results.push({
        date:          servDateStr,
        daySlotId,
        slotNo,
        isNewSlot,
        itemsInserted: items.length,
        skipped:       false,
        statusId:      targetApprStatus,
        action,
      });
    }

    await conn.commit();
    return results;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Look up DayMenu and item details for a list of DAYMENUIDs.
 */
export const getDayMenusByIds = async (dayMenuIds) => {
  if (!dayMenuIds || dayMenuIds.length === 0) return [];
  const uniqueIds = [...new Set(dayMenuIds.map(Number).filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  const placeholders = uniqueIds.map(() => "?").join(",");
  const [rows] = await pool.query(
    `SELECT DM.DAYMENUID, DM.DAYSLOTID, DM.MENUITEMID, DM.BOOKUNTIL, DM.CANCELUNTIL, MI.ITEMNAME
     FROM CMS_DAYMENU DM
     JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
     WHERE DM.DAYMENUID IN (${placeholders})`,
    uniqueIds
  );
  return rows;
};

/**
 * Creates Day Slots (upsert) and Day Menu items for 7 consecutive days.
 * Enforces role authorization: Assistants can only save as DRAFT or SUBMIT for approval.
 * Only Canteen Managers and System Admins can publish directly.
 *
 * @param {object} payload - Validated body from bulkCreateDayMenuSchema
 * @param {object|number} userOrId - Authenticated user object or USERID
 */
export const bulkCreateDayMenu = async (payload, userOrId) => {
  const { CANTEENID, SERVICEID, STARTDATE, STARTTIME, ENDTIME, DAYS, ACTION = "PUBLISH" } = payload;
  const user = typeof userOrId === "object" ? userOrId : { USERID: userOrId };
  const createdBy = user.USERID;

  // Cross-field time validation (Zod schema can't express this simply)
  if (ENDTIME <= STARTTIME) {
    throw new BadRequestError("ENDTIME must be strictly after STARTTIME");
  }

  // Ensure at least one day has items
  const hasAnyItems = DAYS.some((d) => d.ITEMS && d.ITEMS.length > 0);
  if (!hasAnyItems) {
    throw new BadRequestError("At least one day must have menu items configured");
  }

  const isSysAdmin =
    (user.SYSTEMROLES || []).includes("SYSADM") ||
    user.LOGINID === "admin" ||
    user.USERID === 1;

  const isManager =
    isSysAdmin ||
    (user.CANTEENROLES || []).some(
      (r) => Number(r.CANTEENID) === Number(CANTEENID) && r.ROLECODE === "CNTMGR"
    );

  const action = String(ACTION).toUpperCase();

  // Assistant cannot publish directly
  if (action === "PUBLISH" && !isManager) {
    throw new ForbiddenError(
      "Canteen Assistants cannot publish menus directly. Menus can only be saved as draft or submitted for manager approval."
    );
  }

  let targetApprStatus = APPR_STATUS_APPROVED;
  if (action === "DRAFT") {
    targetApprStatus = APPR_STATUS_DRAFT;
  } else if (action === "SUBMIT") {
    targetApprStatus = APPR_STATUS_PENDING;
  }

  return await bulkCreateMenuForWeek({
    canteenId: CANTEENID,
    serviceId: SERVICEID,
    startDate: STARTDATE,
    startTime: STARTTIME,
    endTime:   ENDTIME,
    days:      DAYS,
    createdBy,
    targetApprStatus,
    action,
  });
};


