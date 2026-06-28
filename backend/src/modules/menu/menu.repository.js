import { pool } from "../../db/connection.js";

export const getMenus = async () => {
  // TODO: Replace with a read stored procedure when Module 2 read procedures are added.
  const [rows] = await pool.execute(`
    SELECT
      MENUITEMID,
      MENUCODE,
      SHORTNAME,
      ITEMNAME,
      ITEMDESCR,
      PERMPRICE,
      CONTPRICE,
      VISPRICE,
      OFFPRICE,
      ISSPECIAL,
      STATUS,
      CREATEDBY,
      CREATEDAT,
      UPDATEDAT
    FROM CMS_MENUITEM
    ORDER BY MENUITEMID DESC
  `);

  return rows;
};

export const getMenuById = async (MENUITEMID) => {
  // TODO: Replace with a read stored procedure when Module 2 read procedures are added.
  const [rows] = await pool.execute(
    `
    SELECT
      MENUITEMID,
      MENUCODE,
      SHORTNAME,
      ITEMNAME,
      ITEMDESCR,
      PERMPRICE,
      CONTPRICE,
      VISPRICE,
      OFFPRICE,
      ISSPECIAL,
      STATUS,
      CREATEDBY,
      CREATEDAT,
      UPDATEDAT
    FROM CMS_MENUITEM
    WHERE MENUITEMID = ?
    `,
    [MENUITEMID]
  );

  return rows[0] || null;
};

export const createMenu = async ({
  MENUCODE,
  SHORTNAME,
  ITEMNAME,
  ITEMDESCR = null,
  PERMPRICE,
  CONTPRICE,
  VISPRICE,
  OFFPRICE,
  ISSPECIAL = 0,
  CREATEDBY,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDMENU(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      MENUCODE,
      SHORTNAME,
      ITEMNAME,
      ITEMDESCR,
      PERMPRICE,
      CONTPRICE,
      VISPRICE,
      OFFPRICE,
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
  PERMPRICE,
  CONTPRICE,
  VISPRICE,
  OFFPRICE,
  ISSPECIAL = 0,
  STATUS,
  CHANGEDBY,
  CHGREASON = null,
}) => {
  await pool.execute("CALL CMSUPDMENU(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    MENUITEMID,
    SHORTNAME,
    ITEMNAME,
    ITEMDESCR,
    PERMPRICE,
    CONTPRICE,
    VISPRICE,
    OFFPRICE,
    ISSPECIAL,
    STATUS,
    CHANGEDBY,
    CHGREASON,
  ]);

  return true;
};
