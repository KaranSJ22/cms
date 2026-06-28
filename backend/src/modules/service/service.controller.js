import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

import {
  createService,
  updateService,
  fetchServices,
  fetchService,
} from "./service.service.js";

export const getServicesController = asyncHandler(async (req, res) => {
  const data = await fetchServices();
  return sendSuccess(res, data, "Services fetched successfully");
});

export const getServiceController = asyncHandler(async (req, res) => {
  const data = await fetchService(req.validated.params.id);
  return sendSuccess(res, data, "Service fetched successfully");
});

export const createServiceController = asyncHandler(async (req, res) => {
  const data = await createService(req.validated.body, req.user.USERID);
  return sendSuccess(res, data, "Service created successfully", 201);
});

export const updateServiceController = asyncHandler(async (req, res) => {
  const data = await updateService(
    req.validated.params.id,
    req.validated.body,
    req.user.USERID
  );

  return sendSuccess(res, data, "Service updated successfully");
});
