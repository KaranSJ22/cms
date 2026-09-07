import { pool } from "../../db/connection.js";

export const getDayMenuWorkspace = async (DAYSLOTID) => {
  const [resultSets] = await pool.execute("CALL CMSGETDMENUWORKSPACE(?)", [DAYSLOTID]);
  return resultSets[0] || [];
};

export const replaceDayMenuItems = async ({ DAYSLOTID, ITEMSJSON, CHANGEDBY, REMARKS = null }) => {
  const [resultSets] = await pool.execute("CALL CMSREPLACEDMENUITEMS(?, ?, ?, ?)", [
    DAYSLOTID,
    JSON.stringify(ITEMSJSON),
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
 * Converts an ISO 8601 datetime string to MySQL DATETIME format.
 * MySQL does NOT accept the 'T' separator or trailing 'Z' / milliseconds.
 *
 * e.g.  '2026-08-31T00:30:00.000Z'  →  '2026-08-31 00:30:00'
 *
 * @param {string} isoStr
 * @returns {string} 'YYYY-MM-DD HH:MM:SS'
 */
function toMySQL(isoStr) {
  if (!isoStr) return null;
  // Replace 'T' with space, remove fractional seconds, timezone 'Z' or offsets (+05:30)
  const cleaned = isoStr
    .replace('T', ' ')
    .replace(/\.\d+/, '')
    .replace(/(Z|[+-]\d{2}:?\d{2})$/, '')
    .trim();
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(cleaned) ? `${cleaned}:00` : cleaned;
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
      const [y, m, dayNum] = startDate.split("-").map(Number);
      const servDate = new Date(Date.UTC(y, m - 1, dayNum + d));
      const servDateStr = servDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'

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

      // ── Skip days that have no items configured ───────────────────────
      if (items.length === 0) {
        results.push({
          date:          servDateStr,
          daySlotId:     null,
          slotNo:        null,
          isNewSlot:     false,
          itemsInserted: 0,
          skipped:       true,
          reason:        "No items configured",
        });
        continue;
      }

      // ── 2. Check if a Day Slot already exists for this canteen+service+date
      const [[existingSlot]] = await conn.execute(
        `SELECT DAYSLOTID, SLOTNO FROM CMS_DAYSLOT
          WHERE CANTEENID = ? AND SERVICEID = ? AND SERVDATE = ?`,
        [canteenId, serviceId, servDateStr]
      );

      let daySlotId;
      let slotNo;
      let isNewSlot = false;

      if (existingSlot) {
        // ── 3a. Slot already exists — reuse it ──────────────────────────
        daySlotId = existingSlot.DAYSLOTID;
        slotNo    = existingSlot.SLOTNO;
      } else {
        // ── 3b. No slot — generate ID and create it ──────────────────────
        slotNo = await genAutoNo(conn, "CMS_DAYSLOT", "SLOTNO");

        const [insertSlotResult] = await conn.execute(
          `INSERT INTO CMS_DAYSLOT
            (SLOTNO, CANTEENID, SERVICEID, SERVDATE, STARTTIME, ENDTIME,
             STATUSID, APPRSTATUSID, CREATEDBY)
           VALUES (?, ?, ?, ?, ?, ?, 10, 22, ?)`,
          [slotNo, canteenId, serviceId, servDateStr, startTime, endTime, createdBy]
        );
        daySlotId = insertSlotResult.insertId;

        // Initial audit history row
        await conn.execute(
          `INSERT INTO CMS_SLOTHIST
            (DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE,
             STARTTIME, ENDTIME, STATUSID, APPRSTATUSID, CHANGEDBY, CHGREASON)
           VALUES (?, ?, ?, ?, ?, ?, ?, 10, 22, ?, 'Bulk Creation')`,
          [daySlotId, slotNo, serviceId, canteenId, servDateStr, startTime, endTime, createdBy]
        );

        isNewSlot = true;
      }

      // ── 4. Replace menu items for this slot ──────────────────────────────
      // Archive current items to history before deleting
      const [currentItems] = await conn.execute(
        `SELECT * FROM CMS_DAYMENU WHERE DAYSLOTID = ?`,
        [daySlotId]
      );

      if (currentItems.length > 0) {
        for (const existing of currentItems) {
          await conn.execute(
            `INSERT INTO CMS_DMENUHIST
              (DAYMENUID, DMENUNO, DAYSLOTID, MENUITEMID, ISSPECIAL, ISPREBOOK,
               ISKIOSK, ISBASE, BOOKUNTIL, CANCELUNTIL, AVAILQTY, MAXQTY,
               STATUSID, CHANGEDBY, CHGREASON)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bulk Replace')`,
            [
              existing.DAYMENUID, existing.DMENUNO, existing.DAYSLOTID, existing.MENUITEMID,
              existing.ISSPECIAL, existing.ISPREBOOK, existing.ISKIOSK, existing.ISBASE,
              existing.BOOKUNTIL, existing.CANCELUNTIL, existing.AVAILQTY, existing.MAXQTY,
              existing.STATUSID, createdBy,
            ]
          );
        }
        await conn.execute(`DELETE FROM CMS_DAYMENU WHERE DAYSLOTID = ?`, [daySlotId]);
      }

      // ── 5. Insert each new menu item for this specific day ────────────────
      for (const item of items) {
        const dMenuNo = await genAutoNo(conn, "CMS_DAYMENU", "DMENUNO");

        const defaultCutoff = `${servDateStr} ${String(Math.max(0, parseInt(startTime.split(':')[0], 10) - 1)).padStart(2, '0')}:${startTime.split(':')[1] || '00'}:00`;
        const bookUntilVal = item.BOOKUNTIL ? toMySQL(item.BOOKUNTIL) : defaultCutoff;
        const cancelUntilVal = item.CANCELUNTIL ? toMySQL(item.CANCELUNTIL) : defaultCutoff;

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
