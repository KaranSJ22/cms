import { pool } from "../../db/connection.js";

export const getServices = async () => {
  const [resultSets] = await pool.execute("CALL CMSLISTSERV()");

  return resultSets[0] || [];
};

export const getServiceById = async (SERVICEID) => {
  const [resultSets] = await pool.execute("CALL CMSGETSERV(?)", [SERVICEID]);

  return resultSets[0]?.[0] || null;
};

export const createService = async ({
  SERVCODE,
  SERVNAME,
  DEFSTART,
  DEFEND,
  CREATEDBY,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDSERV(?, ?, ?, ?, ?)",
    [SERVCODE, SERVNAME, DEFSTART, DEFEND, CREATEDBY]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const updateService = async ({
  SERVICEID,
  SERVNAME,
  DEFSTART,
  DEFEND,
  STATUS,
  CHANGEDBY,
  CHGREASON = null,
}) => {
  await pool.execute("CALL CMSUPDSERV(?, ?, ?, ?, ?, ?, ?)", [
    SERVICEID,
    SERVNAME,
    DEFSTART,
    DEFEND,
    STATUS,
    CHANGEDBY,
    CHGREASON,
  ]);

  return true;
};
