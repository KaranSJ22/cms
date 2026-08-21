import { pool } from "../../db/connection.js";

const formatToMySQLDateTime = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const getDayMenus = async ({
  CANTEENID = null,
  SERVICEID = null,
  DAYSLOTID = null,
  SERVDATE = null,
  APPRSTATUS = null,
} = {}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSLISTDMENU(?, ?, ?, ?, ?)",
    [CANTEENID, SERVICEID, DAYSLOTID, SERVDATE, APPRSTATUS]
  );

  return resultSets[0] || [];
};

export const getDayMenuById = async (DAYMENUID) => {
  const [resultSets] = await pool.execute("CALL CMSGETDMENU(?)", [DAYMENUID]);

  return resultSets[0]?.[0] || null;
};

export const createDayMenu = async ({
  DAYSLOTID,
  MENUITEMID,
  ISSPECIAL = 0,
  ISPREBOOK = 1,
  ISKIOSK = 1,
  AVAILQTY,
  MAXQTY,
  BOOKUNTIL,
  CANCELUNTIL,
  CREATEDBY,
  REMARKS = null,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDDMENU(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      DAYSLOTID,
      MENUITEMID,
      ISSPECIAL,
      ISPREBOOK,
      ISKIOSK,
      AVAILQTY,
      MAXQTY,
      formatToMySQLDateTime(BOOKUNTIL),
      formatToMySQLDateTime(CANCELUNTIL),
      CREATEDBY,
      REMARKS,
    ]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const approveDayMenu = async ({
  DAYMENUID,
  APPROVEDBY,
  REMARKS = null,
}) => {
  await pool.execute("CALL CMSAPPDMENU(?, ?, ?)", [
    DAYMENUID,
    APPROVEDBY,
    REMARKS,
  ]);

  return true;
};

export const rejectDayMenu = async ({
  DAYMENUID,
  APPROVEDBY,
  REMARKS = null,
}) => {
  await pool.execute("CALL CMSREJDMENU(?, ?, ?)", [
    DAYMENUID,
    APPROVEDBY,
    REMARKS,
  ]);

  return true;
};

export const viewPublishedMenu = async ({ CANTEENID, SERVDATE, CTYPECODE }) => {
  const [resultSets] = await pool.execute("CALL CMSVIEWMENU(?, ?, ?)", [
    CANTEENID,
    SERVDATE,
    CTYPECODE,
  ]);

  return resultSets[0] || [];
};
