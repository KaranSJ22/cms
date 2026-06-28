import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

import {
  createDaySlot,
  updateDaySlot,
  fetchDaySlots,
  fetchDaySlot,
} from "./dayslot.service.js";

export const getDaySlotsController = asyncHandler(async (req, res) => {
  const data = await fetchDaySlots();
  return sendSuccess(res, data, "Day slots fetched successfully");
});

export const getDaySlotController = asyncHandler(async (req, res) => {
  const data = await fetchDaySlot(req.validated.params.id);
  return sendSuccess(res, data, "Day slot fetched successfully");
});

export const createDaySlotController = asyncHandler(async (req, res) => {
  const data = await createDaySlot(req.validated.body, req.user.USERID);
  return sendSuccess(res, data, "Day slot created successfully", 201);
});

export const updateDaySlotController = asyncHandler(async (req, res) => {
  const data = await updateDaySlot(
    req.validated.params.id,
    req.validated.body,
    req.user.USERID
  );

  return sendSuccess(res, data, "Day slot updated successfully");
});
