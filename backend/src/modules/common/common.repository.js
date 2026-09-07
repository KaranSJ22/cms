import { pool } from "../../db/connection.js";

export const getAllStatus = async () => {
  const [resultSets] = await pool.execute("CALL CMSLISTSTATUS(?)", [null]);

  return resultSets[0] || [];
};

export const getAllCustomerTypes = async () => {
  const [resultSets] = await pool.execute("CALL CMSLISTCUSTTYPE()");

  return resultSets[0] || [];
};

export const getAllScreens = async () => {
  const [resultSets] = await pool.execute("CALL CMSLISTSCREEN()");

  return resultSets[0] || [];
};

export const getAllAutonos = async () => {
  const [resultSets] = await pool.execute("CALL CMSLISTAUTONO()");

  return resultSets[0] || [];
};

export const getAllCanteens = async () => {
  const [resultSets] = await pool.execute("CALL CMSLISTCANTEEN(?)", [null]);

  return resultSets[0] || [];
};