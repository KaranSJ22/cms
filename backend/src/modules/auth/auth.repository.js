import { pool } from "../../db/connection.js";

export const findLoginInfoByLoginId = async (loginId) => {
  const [resultSets] = await pool.query(
    "CALL CMSLOGININFO(?)",
    [loginId]
  );

  return {
    USER: resultSets[0]?.[0] || null,
    USERROLES: resultSets[1] || [],
    CONSUMERROLES: resultSets[1] || [],
    CANTEENROLES: resultSets[2] || [],
  };
};

export const findLoginInfoByRfid = async (rfidUid) => {
  const trimmed = (rfidUid || "").trim();
  if (!trimmed) {
    return {
      USER: null,
      CONSUMERROLES: [],
      CANTEENROLES: [],
    };
  }

  try {
    const [keySets] = await pool.query("CALL CMSVALIDATEACCKEY(?)", [trimmed]);
    const keyIdentity = keySets[0]?.[0];
    if (keyIdentity?.LOGINID) {
      return findLoginInfoByLoginId(keyIdentity.LOGINID);
    }
  } catch (err) {
    // If validation fails or doesn't match, fallback to loginId lookup
  }

  return findLoginInfoByLoginId(trimmed);
};