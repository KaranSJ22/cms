import { pool } from "../../db/connection.js";

export const getKitchenSummary = async (PDAYSLOTID) => {
  const [resultSets] = await pool.query("CALL CMSGETKITCHENSUMMARY(?)", [PDAYSLOTID]);
  return resultSets[0] || [];
};
