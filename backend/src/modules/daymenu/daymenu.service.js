import {
  getDayMenuWorkspace,
  replaceDayMenuItems,
  submitDayMenu as submitDayMenuRepo,
  approveDayMenu as approveDayMenuRepo,
  rejectDayMenu as rejectDayMenuRepo,
  listPendingDayMenus,
  viewPublishedMenu,
  bulkCreateMenuForWeek,
} from "./daymenu.repository.js";
import { BadRequestError } from "../../common/errors/appError.js";

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
  return await listPendingDayMenus(CANTEENID);
};

export const fetchPublishedMenu = async (canteenId, serviceDate, customerTypeCode) => {
  return await viewPublishedMenu({
    CANTEENID: canteenId,
    SERVDATE: serviceDate,
    CTYPECODE: customerTypeCode || "VIS",
  });
};

/**
 * Creates Day Slots (upsert) and Day Menu items for 7 consecutive days.
 * Validates that ENDTIME is strictly after STARTTIME before delegating
 * to the repository's single atomic transaction.
 *
 * @param {object} payload - Validated body from bulkCreateDayMenuSchema
 * @param {number} createdBy - USERID of the authenticated user
 */
export const bulkCreateDayMenu = async (payload, createdBy) => {
  const { CANTEENID, SERVICEID, STARTDATE, STARTTIME, ENDTIME, DAYS } = payload;

  // Cross-field time validation (Zod schema can't express this simply)
  if (ENDTIME <= STARTTIME) {
    throw new BadRequestError("ENDTIME must be strictly after STARTTIME");
  }

  // Ensure at least one day has items
  const hasAnyItems = DAYS.some((d) => d.ITEMS && d.ITEMS.length > 0);
  if (!hasAnyItems) {
    throw new BadRequestError("At least one day must have menu items configured");
  }

  return await bulkCreateMenuForWeek({
    canteenId: CANTEENID,
    serviceId: SERVICEID,
    startDate: STARTDATE,
    startTime: STARTTIME,
    endTime:   ENDTIME,
    days:      DAYS,
    createdBy,
  });
};

