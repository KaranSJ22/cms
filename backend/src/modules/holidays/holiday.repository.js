import { pool } from "../../db/connection.js";

export const addHoliday = async ({
  PHOLIDAYDATE,
  PHOLIDAYNAME,
  PHOLIDAYTYPE,
  PISRECURRING,
  PCREATEDBY,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSADDHOLIDAY(?, ?, ?, ?, ?)",
    [PHOLIDAYDATE, PHOLIDAYNAME, PHOLIDAYTYPE, PISRECURRING, PCREATEDBY]
  );
  return resultSets[0]?.[0] || null;
};

export const updateHoliday = async ({
  PHOLIDAYID,
  PHOLIDAYDATE,
  PHOLIDAYNAME,
  PHOLIDAYTYPE,
  PISRECURRING,
  PSTATUSCODE,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSUPDHOLIDAY(?, ?, ?, ?, ?, ?)",
    [PHOLIDAYID, PHOLIDAYDATE, PHOLIDAYNAME, PHOLIDAYTYPE, PISRECURRING, PSTATUSCODE]
  );
  return resultSets[0]?.[0] || null;
};

export const getHoliday = async (PHOLIDAYID) => {
  const [resultSets] = await pool.query("CALL CMSGETHOLIDAY(?)", [PHOLIDAYID]);
  return resultSets[0]?.[0] || null;
};

export const listHolidays = async (PYEAR) => {
  const [resultSets] = await pool.query("CALL CMSLISTHOLIDAY(?)", [PYEAR]);
  return resultSets[0] || [];
};

export const deactivateHoliday = async (PHOLIDAYID) => {
  const [resultSets] = await pool.query("CALL CMSDEACTHOLIDAY(?)", [PHOLIDAYID]);
  return resultSets[0]?.[0] || null;
};
