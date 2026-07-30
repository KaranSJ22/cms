import { pool } from "../../db/connection.js";

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
      BOOKUNTIL,
      CANCELUNTIL,
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
