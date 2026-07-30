import { pool } from "../../db/connection.js";

export const getDaySlots = async ({
  SERVICEID = null,
  CANTEENID = null,
  DATEFROM = null,
  DATETO = null,
} = {}) => {
  const [resultSets] = await pool.execute("CALL CMSLISTSLOT(?, ?, ?, ?)", [
    SERVICEID,
    CANTEENID,
    DATEFROM,
    DATETO,
  ]);

  return resultSets[0] || [];
};

export const getDaySlotById = async (DAYSLOTID) => {
  const [resultSets] = await pool.execute("CALL CMSGETSLOT(?)", [DAYSLOTID]);

  return resultSets[0]?.[0] || null;
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
