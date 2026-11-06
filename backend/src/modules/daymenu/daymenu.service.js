import {
  getDayMenuWorkspace,
  replaceDayMenuItems,
  submitDayMenu as submitDayMenuRepo,
  approveDayMenu as approveDayMenuRepo,
  rejectDayMenu as rejectDayMenuRepo,
  listPendingDayMenus,
  viewPublishedMenu,
  getDayMenuById as getDayMenuByIdRepo,
  getDayMenusByIds as getDayMenusByIdsRepo,
  bulkCreateMenuForWeek as bulkCreateMenuForWeekRepo,
} from "./daymenu.repository.js";
import { BadRequestError, ForbiddenError } from "../../common/errors/appError.js";

// Canonical Status & Approval State IDs (matching CMS_STATUS)
const STATUS_ACTIVE = 10;
const APPR_STATUS_DRAFT = 20;
const APPR_STATUS_PENDING = 21;
const APPR_STATUS_APPROVED = 22;
const APPR_STATUS_REJECTED = 23;

export const getWorkspace = async (DAYSLOTID) => {
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const updateMenuItems = async (DAYSLOTID, ITEMSJSON, CHANGEDBY, REMARKS = null) => {
  await replaceDayMenuItems({ DAYSLOTID, ITEMSJSON, CHANGEDBY, REMARKS });
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const submitDayMenu = async (DAYSLOTID, SUBMITTEDBY) => {
  await submitDayMenuRepo({ DAYSLOTID, SUBMITTEDBY });
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const approveDayMenu = async (DAYSLOTID, remarks, APPROVEDBY) => {
  await approveDayMenuRepo({ DAYSLOTID, APPROVEDBY, REMARKS: remarks });
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const rejectDayMenu = async (DAYSLOTID, remarks, REJECTEDBY) => {
  await rejectDayMenuRepo({ DAYSLOTID, REJECTEDBY, REMARKS: remarks });
  return await getDayMenuWorkspace(DAYSLOTID);
};

export const fetchPendingDayMenus = async (CANTEENID) => {
  const pending = await listPendingDayMenus(CANTEENID);
  if (!pending || pending.length === 0) return [];

  return pending.map((s) => ({
    ...s,
    SERVICEDATE: s.SERVICEDATE ? String(s.SERVICEDATE).substring(0, 10) : s.SERVDATE,
    SERVDATE: s.SERVICEDATE ? String(s.SERVICEDATE).substring(0, 10) : s.SERVDATE,
    ITEMCOUNT: Number(s.ITEMCOUNT || 0),
    ITEMSNAMES: s.ITEMSNAMES || "",
  }));
};

export const fetchPublishedMenu = async (canteenId, serviceDate, customerTypeCode) => {
  return await viewPublishedMenu({
    CANTEENID: canteenId,
    SERVDATE: serviceDate,
    CTYPECODE: customerTypeCode || "VIS",
  });
};

export const getDayMenuById = async (DAYMENUID) => {
  return await getDayMenuByIdRepo(DAYMENUID);
};

/**
 * Atomically creates Day Slots (upsert) and inserts Day Menu items for multiple days
 * via stored procedure CMSBULKCREATEMENUFORWEEK.
 */
export const bulkCreateMenuForWeek = async (params) => {
  return await bulkCreateMenuForWeekRepo(params);
};

/**
 * Look up DayMenu and item details for a list of DAYMENUIDs via CMSGETDAYMENUBATCH.
 */
export const getDayMenusByIds = async (dayMenuIds) => {
  return await getDayMenusByIdsRepo(dayMenuIds);
};

/**
 * Creates Day Slots (upsert) and Day Menu items for 7 consecutive days.
 * Enforces role authorization: Assistants can only save as DRAFT or SUBMIT for approval.
 * Only Canteen Managers and System Admins can publish directly.
 *
 * @param {object} payload - Validated body from bulkCreateDayMenuSchema
 * @param {object|number} userOrId - Authenticated user object or USERID
 */
export const bulkCreateDayMenu = async (payload, userOrId) => {
  const { CANTEENID, SERVICEID, STARTDATE, STARTTIME, ENDTIME, DAYS, ACTION = "PUBLISH" } = payload;
  const user = typeof userOrId === "object" ? userOrId : { USERID: userOrId };
  const createdBy = user.USERID;

  // Cross-field time validation (Zod schema can't express this simply)
  if (ENDTIME <= STARTTIME) {
    throw new BadRequestError("ENDTIME must be strictly after STARTTIME");
  }

  // Ensure at least one day has items
  const hasAnyItems = DAYS.some((d) => d.ITEMS && d.ITEMS.length > 0);
  if (!hasAnyItems) {
    throw new BadRequestError("At least one day must have menu items configured");
  }

  const isSysAdmin =
    (user.SYSTEMROLES || []).includes("SYSADM") ||
    user.LOGINID === "admin" ||
    user.USERID === 1;

  const isManager =
    isSysAdmin ||
    (user.CANTEENROLES || []).some(
      (r) => Number(r.CANTEENID) === Number(CANTEENID) && r.ROLECODE === "CNTMGR"
    );

  const action = String(ACTION).toUpperCase();

  // Assistant cannot publish directly
  if (action === "PUBLISH" && !isManager) {
    throw new ForbiddenError(
      "Canteen Assistants cannot publish menus directly. Menus can only be saved as draft or submitted for manager approval."
    );
  }

  let targetApprStatus = APPR_STATUS_APPROVED;
  if (action === "DRAFT") {
    targetApprStatus = APPR_STATUS_DRAFT;
  } else if (action === "SUBMIT") {
    targetApprStatus = APPR_STATUS_PENDING;
  }

  return await bulkCreateMenuForWeek({
    canteenId: CANTEENID,
    serviceId: SERVICEID,
    startDate: STARTDATE,
    startTime: STARTTIME,
    endTime:   ENDTIME,
    days:      DAYS,
    createdBy,
    targetApprStatus,
    action,
  });
};


