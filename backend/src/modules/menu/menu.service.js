import {
  createMenu as createMenuRepository,
  updateMenu as updateMenuRepository,
  getMenus,
  getMenuById,
  checkPriceReadiness as checkPriceReadinessRepo,
} from "./menu.repository.js";
import { addItemPrice as addItemPriceRepository } from "../pricing/pricing.repository.js";

export const fetchMenus = async (isSpecial = null, status = null) => {
  return await getMenus(isSpecial, status);
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
    ISSPECIAL: menuData.ISSPECIAL ?? 0,
    SERVICEID: menuData.SERVICEID ?? menuData.serviceId ?? null,
    CREATEDBY: createdByUserId,
  });

  if (!created?.MENUITEMID) {
    const error = new Error("Menu item creation failed");
    error.statusCode = 500;
    throw error;
  }

  // Handle optional initial pricing if provided
  if (
    menuData.PRICING &&
    Array.isArray(menuData.PRICING.PRICES) &&
    menuData.PRICING.PRICES.length > 0
  ) {
    const effFrom =
      menuData.PRICING.EFFFROM || new Date().toISOString().split("T")[0];
    await addItemPriceRepository({
      MENUITEMID: created.MENUITEMID,
      EFFFROM: effFrom,
      PRICEJSON: menuData.PRICING.PRICES,
      CREATEDBY: createdByUserId,
    });
  }

  return await getMenuById(created.MENUITEMID);
};

export const updateMenu = async (MENUITEMID, menuData, changedByUserId) => {
  await updateMenuRepository({
    MENUITEMID,
    SHORTNAME: menuData.SHORTNAME,
    ITEMNAME: menuData.ITEMNAME,
    ITEMDESCR: menuData.ITEMDESCR || null,
    ISSPECIAL: menuData.ISSPECIAL ?? 0,
    SERVICEID: menuData.SERVICEID !== undefined ? menuData.SERVICEID : (menuData.serviceId !== undefined ? menuData.serviceId : null),
    STATUS: menuData.STATUS || 'ACT',
    CHANGEDBY: changedByUserId,
    CHGREASON: menuData.CHGREASON || null,
  });

  return await getMenuById(MENUITEMID);
};


export const checkPriceReadiness = async (MENUITEMID, SERVICEDATE) => {
  return await checkPriceReadinessRepo(MENUITEMID, SERVICEDATE);
};
