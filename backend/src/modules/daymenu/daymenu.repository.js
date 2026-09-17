import { pool } from "../../db/connection.js";
import { toMySQLDateTime, addDaysIST } from "../../utils/dateTime.js";

export const getDayMenuWorkspace = async (DAYSLOTID) => {
  const [resultSets] = await pool.execute("CALL CMSGETDMENUWORKSPACE(?)", [DAYSLOTID]);
  return resultSets[0] || [];
};

export const replaceDayMenuItems = async ({ DAYSLOTID, ITEMSJSON, CHANGEDBY, REMARKS = null }) => {
  const sanitizedItems = (ITEMSJSON || []).map((item) => ({
    ...item,
    BOOKUNTIL: item.BOOKUNTIL ? toMySQLDateTime(item.BOOKUNTIL) : null,
    CANCELUNTIL: item.CANCELUNTIL ? toMySQLDateTime(item.CANCELUNTIL) : null,
  }));
  const [resultSets] = await pool.execute("CALL CMSREPLACEDMENUITEMS(?, ?, ?, ?)", [
    DAYSLOTID,
    JSON.stringify(sanitizedItems),
    CHANGEDBY,
    REMARKS
  ]);
  return true;
};

export const submitDayMenu = async ({ DAYSLOTID, SUBMITTEDBY }) => {
  await pool.execute("CALL CMSSUBMITDMENU(?, ?, ?)", [DAYSLOTID, SUBMITTEDBY, null]);
  return true;
};

export const approveDayMenu = async ({ DAYSLOTID, APPROVEDBY, REMARKS = null }) => {
  await pool.execute("CALL CMSAPPROVEDMENU(?, ?, ?)", [DAYSLOTID, APPROVEDBY, REMARKS]);
  return true;
};

export const rejectDayMenu = async ({ DAYSLOTID, REJECTEDBY, REMARKS = null }) => {
  await pool.execute("CALL CMSREJECTDMENU(?, ?, ?)", [DAYSLOTID, REJECTEDBY, REMARKS]);
  return true;
};

export const listPendingDayMenus = async (CANTEENID = null) => {
  const [resultSets] = await pool.execute("CALL CMSLISTPENDINGDMENUS(?)", [CANTEENID]);
  return resultSets[0] || [];
};

export const viewPublishedMenu = async ({ CANTEENID, SERVDATE, CTYPECODE }) => {
  const [resultSets] = await pool.execute("CALL CMSVIEWMENU(?, ?, ?)", [
    CANTEENID,
    SERVDATE,
    CTYPECODE,
  ]);
  return resultSets[0] || [];
};

export const getDayMenuById = async (DAYMENUID) => {
  const [rows] = await pool.execute("CALL CMSGETDAYMENUBYID(?)", [DAYMENUID]);
  const resultSets = rows[0] || [];
  return resultSets[0] || null;
};

/**
 * Helper: resolves an auto-generated unique number from CMSGENAUTO within
 * an already-open connection (so it participates in the outer transaction).
 *
 * @param {import('mysql2/promise').PoolConnection} conn
 * @param {string} tableName  — e.g. 'CMS_DAYSLOT'
 * @param {string} columnName — e.g. 'SLOTNO'
 * @returns {Promise<string>} the generated value (e.g. 'SLT202608220001')
 */
async function genAutoNo(conn, tableName, columnName) {
  await conn.execute(`CALL CMSGENAUTO(?, ?, @__autono)`, [tableName, columnName]);
  const [[row]] = await conn.execute(`SELECT @__autono AS AUTONO`);
  return row.AUTONO;
}

/**
 * Atomically creates Day Slots (upsert) and inserts Day Menu items for 7
 * consecutive days starting from `startDate`. Raw SQL only — no new SPs.
 *
 * @param {{ canteenId: number, serviceId: number, startDate: string,
 *           startTime: string, endTime: string,
 *           days: Array<{dayIndex:number, items:Array<object>}>,
 *           createdBy: number }} params
 * @returns {Promise<Array<{ date: string, daySlotId: number|null, slotNo: string|null,
 *                           itemsInserted: number, isNewSlot: boolean, skipped: boolean }>>}
 */
export const bulkCreateMenuForWeek = async ({
  canteenId,
  serviceId,
  startDate,
  startTime,
  endTime,
  days,
  createdBy,
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

      if (holiday) {
        results.push({
          date:          servDateStr,
          daySlotId:     null,
          slotNo:        null,
          isNewSlot:     false,
          itemsInserted: 0,
          skipped:       true,
          reason:        `Holiday: ${holiday.HOLIDAYNAME}`,
        });
        continue;
      }

      // Find the per-day config sent from the frontend
      const dayConfig = days.find((day) => day.DAYINDEX === d);
      const items = dayConfig?.ITEMS ?? [];

      // Per-day serving timings (supports day-to-day variance, falls back to bulk default)
      const dayStartTime = dayConfig?.STARTTIME || startTime;
      const dayEndTime   = dayConfig?.ENDTIME || endTime;

      // ── 2. Check if a Day Slot already exists for this canteen+service+date
      const [[existingSlot]] = await conn.execute(
        `SELECT DAYSLOTID, SLOTNO, STARTTIME, ENDTIME, STATUSID, APPRSTATUSID FROM CMS_DAYSLOT
          WHERE CANTEENID = ? AND SERVICEID = ? AND SERVDATE = ?`,
        [canteenId, serviceId, servDateStr]
      );

      let daySlotId;
      let slotNo;
      let isNewSlot = false;

      if (existingSlot) {
        // ── 3a. Slot already exists ──────────────────────────
        daySlotId = existingSlot.DAYSLOTID;
        slotNo    = existingSlot.SLOTNO;

        // Check if menu items already exist for this slot
        const [existingItems] = await conn.execute(
          `SELECT COUNT(*) AS count FROM CMS_DAYMENU WHERE DAYSLOTID = ?`,
          [daySlotId]
        );
        const hasExistingItems = (existingItems[0]?.count || 0) > 0;

        // Check if any bookings exist for this slot
        const [bookingCheck] = await conn.execute(
          `SELECT COUNT(*) AS bookingCount
           FROM CMS_BOOKITEM BI
           JOIN CMS_DAYMENU DM ON BI.DAYMENUID = DM.DAYMENUID
           WHERE DM.DAYSLOTID = ?`,
          [daySlotId]
        );
        const hasBookings = (bookingCheck[0]?.bookingCount || 0) > 0;

        // If items already exist or slot is published/has bookings: LOCK menu items (NO deletion, NO replacement)
        if (hasExistingItems || hasBookings || existingSlot.APPRSTATUSID === 22) {
          let timingUpdated = false;
          // Only parent Day Slot timings can be adjusted (compare normalized HH:MM)
          const normStart = (dayStartTime || '').slice(0, 5);
          const normEnd   = (dayEndTime || '').slice(0, 5);
          const slotStart = (existingSlot.STARTTIME || '').slice(0, 5);
          const slotEnd   = (existingSlot.ENDTIME || '').slice(0, 5);

          if (normStart !== slotStart || normEnd !== slotEnd) {
            await conn.execute(
              `UPDATE CMS_DAYSLOT 
               SET STARTTIME = ?, ENDTIME = ?, UPDATEDBY = ?, UPDATEDAT = CURRENT_TIMESTAMP
               WHERE DAYSLOTID = ?`,
              [dayStartTime, dayEndTime, createdBy, daySlotId]
            );

            await conn.execute(
              `INSERT INTO CMS_SLOTHIST
                (DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE,
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

        const [insertSlotResult] = await conn.execute(
          `INSERT INTO CMS_DAYSLOT
            (SLOTNO, CANTEENID, SERVICEID, SERVDATE, STARTTIME, ENDTIME,
             STATUSID, APPRSTATUSID, CREATEDBY)
           VALUES (?, ?, ?, ?, ?, ?, 10, 22, ?)`,
          [slotNo, canteenId, serviceId, servDateStr, dayStartTime, dayEndTime, createdBy]
        );
        daySlotId = insertSlotResult.insertId;

        // Initial audit history row
        await conn.execute(
          `INSERT INTO CMS_SLOTHIST
            (DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE,
             STARTTIME, ENDTIME, STATUSID, APPRSTATUSID, CHANGEDBY, CHGREASON)
           VALUES (?, ?, ?, ?, ?, ?, ?, 10, 22, ?, 'Bulk Creation')`,
          [daySlotId, slotNo, serviceId, canteenId, servDateStr, dayStartTime, dayEndTime, createdBy]
        );

        isNewSlot = true;
      }

      // ── 4. Insert each new menu item for this unconfigured day slot ────────────────
      for (const item of items) {
        const dMenuNo = await genAutoNo(conn, "CMS_DAYMENU", "DMENUNO");

        const defaultCutoff = `${servDateStr} ${String(Math.max(0, parseInt(dayStartTime.split(':')[0], 10) - 1)).padStart(2, '0')}:${dayStartTime.split(':')[1] || '00'}:00`;
        const bookUntilVal = item.BOOKUNTIL ? toMySQLDateTime(item.BOOKUNTIL) : defaultCutoff;
        const cancelUntilVal = item.CANCELUNTIL ? toMySQLDateTime(item.CANCELUNTIL) : defaultCutoff;

        await conn.execute(
          `INSERT INTO CMS_DAYMENU
            (DMENUNO, DAYSLOTID, MENUITEMID, ISBASE, ISSPECIAL, ISPREBOOK,
             ISKIOSK, BOOKUNTIL, CANCELUNTIL, AVAILQTY, MAXQTY, STATUSID, CREATEDBY)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?)`,
          [
            dMenuNo, daySlotId, item.MENUITEMID,
            item.ISBASE ?? 1, item.ISSPECIAL ?? 0,
            item.ISPREBOOK ?? 1, item.ISKIOSK ?? 1,
            bookUntilVal, cancelUntilVal,
            item.AVAILQTY ?? null, item.MAXQTY ?? 1,
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
