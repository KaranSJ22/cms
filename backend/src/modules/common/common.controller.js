import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

import {
  fetchStatus,
  fetchCustomerTypes,
  fetchScreens,
  fetchAutonos,
} from "./common.service.js";

export const getStatus = asyncHandler(async (req, res) => {
  const data = await fetchStatus();
  return sendSuccess(res, data, "Status list fetched successfully");
});

export const getCustomerTypes = asyncHandler(async (req, res) => {
  const data = await fetchCustomerTypes();
  return sendSuccess(res, data, "Customer types fetched successfully");
});

export const getScreens = asyncHandler(async (req, res) => {
  const data = await fetchScreens();
  return sendSuccess(res, data, "Screens fetched successfully");
});

export const getAutonos = asyncHandler(async (req, res) => {
  const data = await fetchAutonos();
  return sendSuccess(res, data, "Autonumber configuration fetched successfully");
});