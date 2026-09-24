import { pool } from "../../db/connection.js";

export const findLoginInfoByLoginId = async (loginId) => {
  const [resultSets] = await pool.query(
    "CALL CMSLOGININFO(?)",
    [loginId]
  );

  return {
    USER: resultSets[0]?.[0] || null,
    CONSUMERROLES: resultSets[1] || [],
    CANTEENROLES: resultSets[2] || [],
  };
};