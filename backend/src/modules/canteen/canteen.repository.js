import { pool } from "../../db/connection.js";

export const getCanteens = async ({ CENTERID = null } = {}) => {
  const [resultSets] = await pool.execute("CALL CMSLISTCANTEEN(?)", [CENTERID]);
  return resultSets[0] || [];
};
