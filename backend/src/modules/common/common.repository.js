import { pool } from "../../db/connection.js";

export const getAllStatus = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM CMS_STATUS ORDER BY STATUSCODE"
  );

  return rows;
};

export const getAllCustomerTypes = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM CMS_CUSTTYPE ORDER BY CTYPECODE"
  );

  return rows;
};

export const getAllScreens = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM CMS_SCREEN ORDER BY SCREENID"
  );

  return rows;
};

export const getAllAutonos = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM CMS_AUTONOS ORDER BY AUTONOID"
  );

  return rows;
};