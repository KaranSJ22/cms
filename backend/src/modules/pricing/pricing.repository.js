import { pool } from "../../db/connection.js";

export const addItemPrice = async ({
  MENUITEMID,
  EFFFROM,
  PRICEJSON,
  CREATEDBY,
}) => {
  const [resultSets] = await pool.execute("CALL CMSADDITEMPRICE(?, ?, ?, ?)", [
    MENUITEMID,
    EFFFROM,
    JSON.stringify(PRICEJSON),
    CREATEDBY,
  ]);

  return resultSets[0]?.[0] || null;
};

export const getItemPriceHistory = async (MENUITEMID) => {
  const [resultSets] = await pool.execute("CALL CMSLISTITEMPRICE(?)", [
    MENUITEMID,
  ]);

  return resultSets[0] || [];
};

export const getEffectiveItemPrices = async (MENUITEMID, SERVICEDATE) => {
  const [resultSets] = await pool.execute("CALL CMSGETITEMPRICE(?, ?)", [
    MENUITEMID,
    SERVICEDATE,
  ]);

  return resultSets[0] || [];
};

export const getEffectiveItemPrice = async (
  MENUITEMID,
  CTYPECODE,
  SERVICEDATE
) => {
  const [resultSets] = await pool.execute("CALL CMSGETITEMPRICEDT(?, ?, ?)", [
    MENUITEMID,
    CTYPECODE,
    SERVICEDATE,
  ]);

  return resultSets[0]?.[0] || null;
};

export const deactivateItemPrice = async (ITEMPRICEID) => {
  const [resultSets] = await pool.execute("CALL CMSDEACTITEMPRICE(?)", [
    ITEMPRICEID,
  ]);

  return resultSets[0]?.[0] || null;
};
