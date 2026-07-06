import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

import {
  createDayMenu,
  approveDayMenu,
  rejectDayMenu,
  fetchDayMenus,
  fetchDayMenu,
  fetchPublishedMenu,
} from "./daymenu.service.js";

export const getDayMenusController = asyncHandler(async (req, res) => {
  const data = await fetchDayMenus();
  return sendSuccess(res, data, "Day menus fetched successfully");
});

export const getDayMenuController = asyncHandler(async (req, res) => {
  const data = await fetchDayMenu(req.validated.params.id);
  return sendSuccess(res, data, "Day menu fetched successfully");
});

export const createDayMenuController = asyncHandler(async (req, res) => {
  const data = await createDayMenu(req.validated.body, req.user.USERID);
  return sendSuccess(res, data, "Day menu created successfully", 201);
});

export const approveDayMenuController = asyncHandler(async (req, res) => {
  const data = await approveDayMenu(
    req.validated.params.id,
    req.validated.body.REMARKS,
    req.user.USERID
  );

  return sendSuccess(res, data, "Day menu approved successfully");
});

export const rejectDayMenuController = asyncHandler(async (req, res) => {
  const data = await rejectDayMenu(
    req.validated.params.id,
    req.validated.body.REMARKS,
    req.user.USERID
  );

  return sendSuccess(res, data, "Day menu rejected successfully");
});

export const viewPublishedMenuController = asyncHandler(async (req, res) => {
  const data = await fetchPublishedMenu(
    req.validated.query.serviceDate,
    req.user.CTYPECODE || "VISITOR"
  );

  return sendSuccess(res, data, "Published menu fetched successfully");
});
