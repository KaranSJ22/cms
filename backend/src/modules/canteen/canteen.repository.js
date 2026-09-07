import { pool } from "../../db/connection.js";

export const getCanteens = async ({ CENTERID = null } = {}) => {
  const [resultSets] = await pool.execute("CALL CMSLISTCANTEEN(?)", [CENTERID]);
  return resultSets[0] || [];
};

/**
 * Resolves the CANTEENID associated with a given operational resource
 * (DAYSLOT, DAYMENU, or BOOKING) via stored procedures.
 */
export const getResourceCanteenId = async (resourceType, id) => {
  if (!id) return null;

  let spName = "";
  if (resourceType === "DAYSLOT") {
    spName = "CMSGETCANTEENBYSLOT";
  } else if (resourceType === "DAYMENU") {
    spName = "CMSGETCANTEENBYDAYMENU";
  } else if (resourceType === "BOOKING") {
    spName = "CMSGETCANTEENBYBOOKING";
  }

  if (!spName) return null;
  const [resultSets] = await pool.execute(`CALL ${spName}(?)`, [id]);
  return resultSets[0]?.[0]?.CANTEENID || null;
};
