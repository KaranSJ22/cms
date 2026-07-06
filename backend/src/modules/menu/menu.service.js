import {
  createMenu as createMenuRepository,
  updateMenu as updateMenuRepository,
  getMenus,
  getMenuById,
} from "./menu.repository.js";

export const fetchMenus = async () => {
  return await getMenus();
};

export const fetchMenu = async (MENUITEMID) => {
  const menu = await getMenuById(MENUITEMID);

  if (!menu) {
    const error = new Error("Menu item not found");
    error.statusCode = 404;
    throw error;
  }

  return menu;
};

export const createMenu = async (menuData, createdByUserId) => {
  const created = await createMenuRepository({
    MENUCODE: menuData.MENUCODE,
    SHORTNAME: menuData.SHORTNAME,
    ITEMNAME: menuData.ITEMNAME,
    ITEMDESCR: menuData.ITEMDESCR || null,
    PERMPRICE: menuData.PERMPRICE,
    CONTPRICE: menuData.CONTPRICE,
    VISPRICE: menuData.VISPRICE,
    OFFPRICE: menuData.OFFPRICE,
    ISSPECIAL: menuData.ISSPECIAL ?? 0,
    CREATEDBY: createdByUserId,
  });

  if (!created?.MENUITEMID) {
    const error = new Error("Menu item creation failed");
    error.statusCode = 500;
    throw error;
  }

  return await getMenuById(created.MENUITEMID);
};

export const updateMenu = async (MENUITEMID, menuData, changedByUserId) => {
  await updateMenuRepository({
    MENUITEMID,
    SHORTNAME: menuData.SHORTNAME,
    ITEMNAME: menuData.ITEMNAME,
    ITEMDESCR: menuData.ITEMDESCR || null,
    PERMPRICE: menuData.PERMPRICE,
    CONTPRICE: menuData.CONTPRICE,
    VISPRICE: menuData.VISPRICE,
    OFFPRICE: menuData.OFFPRICE,
    ISSPECIAL: menuData.ISSPECIAL ?? 0,
    STATUS: menuData.STATUS,
    CHANGEDBY: changedByUserId,
    CHGREASON: menuData.CHGREASON || null,
  });

  return await getMenuById(MENUITEMID);
};
