import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as CanteenService from "./canteen.service.js";

export const getCanteens = asyncHandler(async (req, res) => {
  const centerId = req.query.CENTERID || req.query.centerId || null;
  const canteens = await CanteenService.getCanteens({
    CENTERID: centerId ? Number(centerId) : null,
  });

  return sendSuccess(res, canteens, "Canteens retrieved successfully");
});

export const getCanteenByIdController = asyncHandler(async (req, res) => {
  const canteenId = Number(req.params.id);
  const canteen = await CanteenService.getCanteenById(canteenId);
  return sendSuccess(res, canteen, "Canteen details retrieved successfully");
});

export const createCanteenController = asyncHandler(async (req, res) => {
  const canteen = await CanteenService.createCanteen(req.body, req.user.USERID);
  return sendSuccess(res, canteen, "Canteen facility created successfully", 201);
});

export const updateCanteenController = asyncHandler(async (req, res) => {
  const canteenId = Number(req.params.id);
  const canteen = await CanteenService.updateCanteen(canteenId, req.body);
  return sendSuccess(res, canteen, "Canteen facility updated successfully");
});

export const deactivateCanteenController = asyncHandler(async (req, res) => {
  const canteenId = Number(req.params.id);
  const canteen = await CanteenService.deactivateCanteen(canteenId);
  return sendSuccess(res, canteen, "Canteen facility deactivated successfully");
});

export const listCentersController = asyncHandler(async (req, res) => {
  const centers = await CanteenService.listCenters();
  return sendSuccess(res, centers, "Campus centers retrieved successfully");
});

export const createCenterController = asyncHandler(async (req, res) => {
  const result = await CanteenService.createCenter(req.body);
  return sendSuccess(res, result, "Campus center registered successfully", 201);
});

