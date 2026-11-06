import { pool } from "../../db/connection.js";

export const getCanteens = async ({ CENTERID = null } = {}) => {
  const [resultSets] = await pool.query("CALL CMSLISTCANTEEN(?)", [CENTERID]);
  return resultSets[0] || [];
};

export const getCanteenById = async (CANTEENID) => {
  const [resultSets] = await pool.query("CALL CMSGETCANTEEN(?)", [CANTEENID]);
  return resultSets[0]?.[0] || null;
};

export const createCanteen = async ({
  CENTERID,
  CANTEENCODE,
  CANTEENNAME,
  LOCATION = null,
  USERID,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSADDCANTEEN(?, ?, ?, ?, ?)",
    [CENTERID, CANTEENCODE, CANTEENNAME, LOCATION, USERID]
  );
  return resultSets[0]?.[0] || null;
};

export const updateCanteen = async ({
  CANTEENID,
  CANTEENNAME,
  LOCATION = null,
  STATUSCODE = "ACT",
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSUPDCANTEEN(?, ?, ?, ?)",
    [CANTEENID, CANTEENNAME, LOCATION, STATUSCODE]
  );
  return resultSets[0]?.[0] || null;
};

export const deactivateCanteen = async (CANTEENID) => {
  const [resultSets] = await pool.query("CALL CMSDEACTCANTEEN(?)", [CANTEENID]);
  return resultSets[0]?.[0] || null;
};

export const listCenters = async () => {
  const [resultSets] = await pool.query("CALL CMSLISTCENTER()");
  return resultSets[0] || [];
};

export const createCenter = async ({ CENTERCODE, CENTERNAME, LOCATION = null }) => {
  const [resultSets] = await pool.query(
    "CALL CMSADDCENTER(?, ?, ?)",
    [CENTERCODE, CENTERNAME, LOCATION]
  );
  return resultSets[0]?.[0] || null;
};

export const getResourceCanteenId = async (resourceType, id) => {
  const [resultSets] = await pool.query(
    "CALL CMSGETRESOURCECANTEEN(?, ?)",
    [resourceType, Number(id)]
  );
  return resultSets[0]?.[0]?.CANTEENID || null;
};
