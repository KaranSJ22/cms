import { pool } from "../../db/connection.js";

/**
 * Retrieves kitchen preparation summary and customer-type breakdown for a day slot.
 */
export const getKitchenSummary = async (PDAYSLOTID) => {
  const [resultSets] = await pool.query("CALL CMSGETKITCHENSUMMARY(?)", [PDAYSLOTID]);
  return {
    summary: resultSets[0] || [],
    breakdownByCustomerType: resultSets[1] || [],
  };
};
