import { pool } from "../../db/connection.js";
import { toMySQLDateTime } from "../../utils/dateTime.js";

export const getDayMenuWorkspace = async (DAYSLOTID) => {
  const [resultSets] = await pool.query("CALL CMSGETDMENUWORKSPACE(?)", [DAYSLOTID]);
  return resultSets[0] || [];
};

export const replaceDayMenuItems = async ({ DAYSLOTID, ITEMSJSON, CHANGEDBY, REMARKS = null }) => {
  const sanitizedItems = (ITEMSJSON || []).map((item) => ({
    ...item,
    BOOKUNTIL: item.BOOKUNTIL ? toMySQLDateTime(item.BOOKUNTIL) : null,
    CANCELUNTIL: item.CANCELUNTIL ? toMySQLDateTime(item.CANCELUNTIL) : null,
  }));
  const [resultSets] = await pool.query("CALL CMSREPLACEDMENUITEMS(?, ?, ?, ?)", [
    DAYSLOTID,
    JSON.stringify(sanitizedItems),
    CHANGEDBY,
    REMARKS,
  ]);
  return true;
};

export const submitDayMenu = async ({ DAYSLOTID, SUBMITTEDBY }) => {
  await pool.query("CALL CMSSUBMITDMENU(?, ?, ?)", [DAYSLOTID, SUBMITTEDBY, null]);
  return true;
};

export const approveDayMenu = async ({ DAYSLOTID, APPROVEDBY, REMARKS = null }) => {
  await pool.query("CALL CMSAPPROVEDMENU(?, ?, ?)", [DAYSLOTID, APPROVEDBY, REMARKS]);
  return true;
};

export const rejectDayMenu = async ({ DAYSLOTID, REJECTEDBY, REMARKS = null }) => {
  await pool.query("CALL CMSREJECTDMENU(?, ?, ?)", [DAYSLOTID, REJECTEDBY, REMARKS]);
  return true;
};

export const listPendingDayMenus = async (CANTEENID = null) => {
  const [resultSets] = await pool.query("CALL CMSLISTPENDINGDMENUS(?)", [CANTEENID]);
  return resultSets[0] || [];
};

export const viewPublishedMenu = async ({ CANTEENID, SERVDATE, CTYPECODE }) => {
  const [resultSets] = await pool.query("CALL CMSVIEWMENU(?, ?, ?)", [
    CANTEENID,
    SERVDATE,
    CTYPECODE,
  ]);
  return resultSets[0] || [];
};

export const getDayMenuById = async (DAYMENUID) => {
  const [rows] = await pool.query("CALL CMSGETDAYMENUBYID(?)", [DAYMENUID]);
  const resultSets = rows[0] || [];
  return resultSets[0] || null;
};

export const getDayMenusByIds = async (dayMenuIds) => {
  const ids = Array.isArray(dayMenuIds) ? dayMenuIds.map(Number).filter(Boolean) : [];
  if (ids.length === 0) return [];
  const [resultSets] = await pool.query("CALL CMSGETDAYMENUBATCH(?)", [
    JSON.stringify(ids),
  ]);
  return resultSets[0] || [];
};

export const bulkCreateMenuForWeek = async ({
  canteenId,
  serviceId,
  startDate,
  startTime,
  endTime,
  days,
  createdBy,
  targetApprStatus,
  action,
}) => {
  const sanitizedDays = (days || []).map((day) => ({
    ...day,
    ITEMS: (day.ITEMS || []).map((item) => ({
      ...item,
      BOOKUNTIL: item.BOOKUNTIL ? toMySQLDateTime(item.BOOKUNTIL) : null,
      CANCELUNTIL: item.CANCELUNTIL ? toMySQLDateTime(item.CANCELUNTIL) : null,
    })),
  }));

  const [resultSets] = await pool.query(
    "CALL CMSBULKCREATEMENUFORWEEK(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      canteenId,
      serviceId,
      startDate,
      startTime,
      endTime,
      JSON.stringify(sanitizedDays),
      createdBy,
      targetApprStatus,
      action,
    ]
  );
  return (resultSets[0] || []).map((row) => ({
    date: row.date,
    daySlotId: row.daySlotId,
    slotNo: row.slotNo,
    isNewSlot: Boolean(row.isNewSlot),
    itemsInserted: Number(row.itemsInserted || 0),
    timingUpdated: Boolean(row.timingUpdated),
    skipped: Boolean(row.skipped),
    reason: row.reason || null,
    statusId: row.statusId != null ? Number(row.statusId) : null,
    action: row.action,
  }));
};
