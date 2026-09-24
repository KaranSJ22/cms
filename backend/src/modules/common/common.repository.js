import { pool } from "../../db/connection.js";

export const getAllStatus = async (statusGrp = null) => {
  const [resultSets] = await pool.query("CALL CMSLISTSTATUS(?)", [statusGrp || null]);

  return resultSets[0] || [];
};

export const getAllCustomerTypes = async () => {
  const [resultSets] = await pool.query("CALL CMSLISTCUSTTYPE()");

  return resultSets[0] || [];
};

export const getAllScreens = async () => {
  const [resultSets] = await pool.query("CALL CMSLISTSCREEN()");

  return resultSets[0] || [];
};

export const getAllAutonos = async () => {
  const [resultSets] = await pool.query("CALL CMSLISTAUTONO()");

  return resultSets[0] || [];
};