import { pool } from "../../db/connection.js";

export const getMenus = async (ISSPECIAL = null, STATUS = null) => {
  const [resultSets] = await pool.execute("CALL CMSLISTMENUITEM(?, ?)", [
    ISSPECIAL,
    STATUS,
  ]);

  return resultSets[0] || [];
};

export const getMenuById = async (MENUITEMID) => {
  const [resultSets] = await pool.execute("CALL CMSGETMENUITEM(?)", [
    MENUITEMID,
  ]);

  return resultSets[0]?.[0] || null;
};

export const createMenu = async ({
  MENUCODE,
  SHORTNAME,
  ITEMNAME,
  ITEMDESCR = null,
  ISSPECIAL = 0,
  SERVICEID = null,
  CREATEDBY,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDMENUITEM(?, ?, ?, ?, ?, ?)",
    [
      SHORTNAME,
      ITEMNAME,
      ITEMDESCR,
      ISSPECIAL,
      SERVICEID,
      CREATEDBY,
    ]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const updateMenu = async ({
  MENUITEMID,
  SHORTNAME,
  ITEMNAME,
  ITEMDESCR = null,
  ISSPECIAL = 0,
  SERVICEID = null,
  STATUS,
  CHANGEDBY,
  CHGREASON = null,
}) => {
  await pool.execute("CALL CMSUPDMENUITEM(?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    MENUITEMID,
    SHORTNAME,
    ITEMNAME,
    ITEMDESCR,
    ISSPECIAL,
    SERVICEID,
    STATUS,
    CHANGEDBY,
    CHGREASON,
  ]);

  return true;
};

export const checkPriceReadiness = async (MENUITEMID, SERVICEDATE) => {
  // If it doesn't throw an error, it is ready.
  // The procedure raises a custom SQL error if it is not ready.
  await pool.execute("CALL CMSCHECKITEMPRICEREADINESS(?, ?)", [
    MENUITEMID,
    SERVICEDATE,
  ]);

  return { isReady: true };
};
