import { pool } from "../../db/connection.js";

export const findLoginInfoByLoginId = async (LOGINID) => {
  const [resultSets] = await pool.execute("CALL CMSLOGININFO(?)", [LOGINID]);

  // mysql2 returns stored procedure results as nested arrays.
  // First result set contains rows returned by SELECT inside procedure.
  const rows = resultSets[0];

  return rows?.[0] || null;
};