import { pool } from "../../db/connection.js";

export const getServices = async () => {
  // TODO: Replace with a read stored procedure when Module 2 read procedures are added.
  const [rows] = await pool.execute(`
    SELECT
      SERVICEID,
      SERVCODE,
      SERVNAME,
      DEFSTART,
      DEFEND,
      VALIDFROM,
      VALIDUNTIL,
      STATUS,
      CREATEDBY,
      CREATEDAT,
      UPDATEDAT
    FROM CMS_SERVICE
    ORDER BY SERVICEID DESC
  `);

  return rows;
};

export const getServiceById = async (SERVICEID) => {
  // TODO: Replace with a read stored procedure when Module 2 read procedures are added.
  const [rows] = await pool.execute(
    `
    SELECT
      SERVICEID,
      SERVCODE,
      SERVNAME,
      DEFSTART,
      DEFEND,
      VALIDFROM,
      VALIDUNTIL,
      STATUS,
      CREATEDBY,
      CREATEDAT,
      UPDATEDAT
    FROM CMS_SERVICE
    WHERE SERVICEID = ?
    `,
    [SERVICEID]
  );

  return rows[0] || null;
};

export const createService = async ({
  SERVCODE,
  SERVNAME,
  DEFSTART,
  DEFEND,
  VALIDFROM = null,
  VALIDUNTIL = null,
  CREATEDBY,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDSERV(?, ?, ?, ?, ?, ?, ?)",
    [SERVCODE, SERVNAME, DEFSTART, DEFEND, VALIDFROM, VALIDUNTIL, CREATEDBY]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const updateService = async ({
  SERVICEID,
  SERVNAME,
  DEFSTART,
  DEFEND,
  VALIDFROM = null,
  VALIDUNTIL = null,
  STATUS,
  CHANGEDBY,
  CHGREASON = null,
}) => {
  await pool.execute("CALL CMSUPDSERV(?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    SERVICEID,
    SERVNAME,
    DEFSTART,
    DEFEND,
    VALIDFROM,
    VALIDUNTIL,
    STATUS,
    CHANGEDBY,
    CHGREASON,
  ]);

  return true;
};
