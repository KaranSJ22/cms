import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

import {
  getWorkspace,
  updateMenuItems,
  submitDayMenu,
  approveDayMenu,
  rejectDayMenu,
  fetchPendingDayMenus,
  fetchPublishedMenu,
  bulkCreateDayMenu,
} from "./daymenu.service.js";

export const getDayMenuWorkspaceController = asyncHandler(async (req, res) => {
  const data = await getWorkspace(req.params.id);
  return sendSuccess(res, data, "Day menu workspace fetched successfully");
});

export const updateMenuItemsController = asyncHandler(async (req, res) => {
  const data = await updateMenuItems(
    req.params.id,
    req.validated.body.ITEMSJSON,
    req.user.USERID,
    req.validated.body.REMARKS ?? null
  );
  return sendSuccess(res, data, "Day menu items replaced successfully");
});

export const submitDayMenuController = asyncHandler(async (req, res) => {
  const data = await submitDayMenu(req.params.id, req.user.USERID);
  return sendSuccess(res, data, "Day menu submitted for approval successfully");
});

export const approveDayMenuController = asyncHandler(async (req, res) => {
  const data = await approveDayMenu(
    req.params.id,
    req.validated.body.REMARKS,
    req.user.USERID
  );
  return sendSuccess(res, data, "Day menu approved successfully");
});

export const rejectDayMenuController = asyncHandler(async (req, res) => {
  const data = await rejectDayMenu(
    req.params.id,
    req.validated.body.REMARKS,
    req.user.USERID
  );
  return sendSuccess(res, data, "Day menu rejected successfully");
});

export const getPendingDayMenusController = asyncHandler(async (req, res) => {
  // If canteenId is not provided in query, fetch for all where manager has access
  // For strict resource isolation, we should probably require canteenId
  const data = await fetchPendingDayMenus(req.query.canteenId || null);
  return sendSuccess(res, data, "Pending day menus fetched successfully");
});

export const viewPublishedMenuController = asyncHandler(async (req, res) => {
  const data = await fetchPublishedMenu(
    req.validated.query.canteenId,
    req.validated.query.serviceDate,
    req.user.CTYPECODE || "VIS"
  );
  return sendSuccess(res, data, "Published menu fetched successfully");
});

/**
 * POST /api/day-menus/bulk
 * Roles: CTNMGR, CTNAST
 * Creates Day Slots (upsert) and menu items for 7 days starting from STARTDATE.
 */
export const bulkCreateDayMenuController = asyncHandler(async (req, res) => {
  const data = await bulkCreateDayMenu(req.validated.body, req.user.USERID);
  return sendSuccess(res, data, "7-day bulk menu created successfully", 201);
});
