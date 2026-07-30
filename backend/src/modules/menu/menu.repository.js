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
  CREATEDBY,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDMENUITEM(?, ?, ?, ?, ?, ?)",
    [
      MENUCODE,
      SHORTNAME,
      ITEMNAME,
      ITEMDESCR,
      ISSPECIAL,
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
  STATUS,
  CHANGEDBY,
  CHGREASON = null,
}) => {
  await pool.execute("CALL CMSUPDMENUITEM(?, ?, ?, ?, ?, ?, ?, ?)", [
    MENUITEMID,
    SHORTNAME,
    ITEMNAME,
    ITEMDESCR,
    ISSPECIAL,
    STATUS,
    CHANGEDBY,
    CHGREASON,
  ]);

  return true;
};
