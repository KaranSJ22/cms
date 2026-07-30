import {
  createDayMenu as createDayMenuRepository,
  approveDayMenu as approveDayMenuRepository,
  rejectDayMenu as rejectDayMenuRepository,
  getDayMenus,
  getDayMenuById,
  viewPublishedMenu,
} from "./daymenu.repository.js";

export const fetchDayMenus = async () => {
  return await getDayMenus();
};

export const fetchDayMenu = async (DAYMENUID) => {
  const dayMenu = await getDayMenuById(DAYMENUID);

  if (!dayMenu) {
    const error = new Error("Day menu not found");
    error.statusCode = 404;
    throw error;
  }

  return dayMenu;
};

export const createDayMenu = async (dayMenuData, addedByUserId) => {
  const created = await createDayMenuRepository({
    DAYSLOTID: dayMenuData.DAYSLOTID,
    MENUITEMID: dayMenuData.MENUITEMID,
    ISSPECIAL: dayMenuData.ISSPECIAL ?? 0,
    ISPREBOOK: dayMenuData.ISPREBOOK ?? 1,
    ISKIOSK: dayMenuData.ISKIOSK ?? 1,
    AVAILQTY: dayMenuData.AVAILQTY,
    MAXQTY: dayMenuData.MAXQTY,
    BOOKUNTIL: dayMenuData.BOOKUNTIL,
    CANCELUNTIL: dayMenuData.CANCELUNTIL,
    CREATEDBY: addedByUserId,
    REMARKS: dayMenuData.REMARKS || null,
  });

  if (!created?.DAYMENUID) {
    const error = new Error("Day menu creation failed");
    error.statusCode = 500;
    throw error;
  }

  return await getDayMenuById(created.DAYMENUID);
};

export const approveDayMenu = async (DAYMENUID, remarks, approvedByUserId) => {
  await approveDayMenuRepository({
    DAYMENUID,
    APPROVEDBY: approvedByUserId,
    REMARKS: remarks || null,
  });

  return await getDayMenuById(DAYMENUID);
};

export const rejectDayMenu = async (DAYMENUID, remarks, approvedByUserId) => {
  await rejectDayMenuRepository({
    DAYMENUID,
    APPROVEDBY: approvedByUserId,
    REMARKS: remarks || null,
  });

  return await getDayMenuById(DAYMENUID);
};

export const fetchPublishedMenu = async (
  canteenId,
  serviceDate,
  customerTypeCode
) => {
  return await viewPublishedMenu({
    CANTEENID: canteenId,
    SERVDATE: serviceDate,
    CTYPECODE: customerTypeCode || "VISITOR",
  });
};
