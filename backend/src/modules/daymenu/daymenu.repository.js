import { pool } from "../../db/connection.js";

export const getDayMenus = async () => {
  // TODO: Replace with a read stored procedure when Module 2 read procedures are added.
  const [rows] = await pool.execute(`
    SELECT
      DM.DAYMENUID,
      DM.DMENUNO,
      DM.DAYSLOTID,
      S.SERVCODE,
      S.SERVNAME,
      DS.SERVDATE,
      DS.STARTTIME,
      DS.ENDTIME,
      DM.MENUITEMID,
      MI.MENUCODE,
      MI.ITEMNAME,
      DM.ISSPECIAL,
      DM.ISPREBOOK,
      DM.ISWALKIN,
      DM.ISKIOSK,
      DM.AVAILQTY,
      DM.MAXQTY,
      DM.BOOKSTART,
      DM.BOOKEND,
      DM.CANCELAT,
      DM.APPRSTATUS,
      DM.ADDEDBY,
      DM.APPROVEDBY,
      DM.APPROVEDAT,
      DM.REMARKS,
      DM.CREATEDAT,
      DM.UPDATEDAT
    FROM CMS_DAYMENU DM
    JOIN CMS_DAYSLOT DS
      ON DM.DAYSLOTID = DS.DAYSLOTID
    JOIN CMS_SERVICE S
      ON DS.SERVICEID = S.SERVICEID
    JOIN CMS_MENUITEM MI
      ON DM.MENUITEMID = MI.MENUITEMID
    ORDER BY DS.SERVDATE DESC, DS.STARTTIME, MI.ITEMNAME
  `);

  return rows;
};

export const getDayMenuById = async (DAYMENUID) => {
  // TODO: Replace with a read stored procedure when Module 2 read procedures are added.
  const [rows] = await pool.execute(
    `
    SELECT
      DM.DAYMENUID,
      DM.DMENUNO,
      DM.DAYSLOTID,
      S.SERVCODE,
      S.SERVNAME,
      DS.SERVDATE,
      DS.STARTTIME,
      DS.ENDTIME,
      DM.MENUITEMID,
      MI.MENUCODE,
      MI.ITEMNAME,
      DM.ISSPECIAL,
      DM.ISPREBOOK,
      DM.ISWALKIN,
      DM.ISKIOSK,
      DM.AVAILQTY,
      DM.MAXQTY,
      DM.BOOKSTART,
      DM.BOOKEND,
      DM.CANCELAT,
      DM.APPRSTATUS,
      DM.ADDEDBY,
      DM.APPROVEDBY,
      DM.APPROVEDAT,
      DM.REMARKS,
      DM.CREATEDAT,
      DM.UPDATEDAT
    FROM CMS_DAYMENU DM
    JOIN CMS_DAYSLOT DS
      ON DM.DAYSLOTID = DS.DAYSLOTID
    JOIN CMS_SERVICE S
      ON DS.SERVICEID = S.SERVICEID
    JOIN CMS_MENUITEM MI
      ON DM.MENUITEMID = MI.MENUITEMID
    WHERE DM.DAYMENUID = ?
    `,
    [DAYMENUID]
  );

  return rows[0] || null;
};

export const createDayMenu = async ({
  DAYSLOTID,
  MENUITEMID,
  ISSPECIAL = 0,
  ISPREBOOK = 1,
  ISWALKIN = 1,
  ISKIOSK = 1,
  AVAILQTY,
  MAXQTY,
  BOOKSTART,
  BOOKEND,
  CANCELAT,
  ADDEDBY,
  REMARKS = null,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDDMENU(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      DAYSLOTID,
      MENUITEMID,
      ISSPECIAL,
      ISPREBOOK,
      ISWALKIN,
      ISKIOSK,
      AVAILQTY,
      MAXQTY,
      BOOKSTART,
      BOOKEND,
      CANCELAT,
      ADDEDBY,
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
  await pool.execute("CALL CMSAPPDMENU(?, ?, ?, ?)", [
    DAYMENUID,
    "APP",
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
  await pool.execute("CALL CMSAPPDMENU(?, ?, ?, ?)", [
    DAYMENUID,
    "REJ",
    APPROVEDBY,
    REMARKS,
  ]);

  return true;
};

export const viewPublishedMenu = async ({ SERVDATE, CTYPECODE }) => {
  const [resultSets] = await pool.execute("CALL CMSVIEWMENU(?, ?)", [
    SERVDATE,
    CTYPECODE,
  ]);

  return resultSets[0] || [];
};
