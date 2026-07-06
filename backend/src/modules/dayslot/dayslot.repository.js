import { pool } from "../../db/connection.js";

export const getDaySlots = async () => {
  // TODO: Replace with a read stored procedure when Module 2 read procedures are added.
  const [rows] = await pool.execute(`
    SELECT
      DS.DAYSLOTID,
      DS.SERVICEID,
      S.SERVCODE,
      S.SERVNAME,
      DS.SERVDATE,
      DS.STARTTIME,
      DS.ENDTIME,
      DS.STATUS,
      DS.CREATEDBY,
      DS.CREATEDAT,
      DS.UPDATEDAT
    FROM CMS_DAYSLOT DS
    JOIN CMS_SERVICE S
      ON DS.SERVICEID = S.SERVICEID
    ORDER BY DS.SERVDATE DESC, DS.STARTTIME
  `);

  return rows;
};

export const getDaySlotById = async (DAYSLOTID) => {
  // TODO: Replace with a read stored procedure when Module 2 read procedures are added.
  const [rows] = await pool.execute(
    `
    SELECT
      DS.DAYSLOTID,
      DS.SERVICEID,
      S.SERVCODE,
      S.SERVNAME,
      DS.SERVDATE,
      DS.STARTTIME,
      DS.ENDTIME,
      DS.STATUS,
      DS.CREATEDBY,
      DS.CREATEDAT,
      DS.UPDATEDAT
    FROM CMS_DAYSLOT DS
    JOIN CMS_SERVICE S
      ON DS.SERVICEID = S.SERVICEID
    WHERE DS.DAYSLOTID = ?
    `,
    [DAYSLOTID]
  );

  return rows[0] || null;
};

export const createDaySlot = async ({
  SERVICEID,
  SERVDATE,
  STARTTIME,
  ENDTIME,
  CREATEDBY,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDSLOT(?, ?, ?, ?, ?)",
    [SERVICEID, SERVDATE, STARTTIME, ENDTIME, CREATEDBY]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const updateDaySlot = async ({
  DAYSLOTID,
  STARTTIME,
  ENDTIME,
  STATUS,
  CHANGEDBY,
  CHGREASON = null,
}) => {
  await pool.execute("CALL CMSUPDSLOT(?, ?, ?, ?, ?, ?)", [
    DAYSLOTID,
    STARTTIME,
    ENDTIME,
    STATUS,
    CHANGEDBY,
    CHGREASON,
  ]);

  return true;
};
