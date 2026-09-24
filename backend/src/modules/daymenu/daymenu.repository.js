import { pool } from "../../db/connection.js";
import { toMySQLDateTime } from "../../utils/dateTime.js";

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
    REMARKS,
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
