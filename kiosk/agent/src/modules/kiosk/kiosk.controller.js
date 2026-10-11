import * as KioskService from "./kiosk.service.js";
import { sendSuccess } from "../../common/responses/apiResponse.js";

export const scanSelfServiceController = async (req, res, next) => {
  try {
    const identifier = req.validated?.body?.PIDENTIFIER || req.body?.PIDENTIFIER;
    const result = KioskService.scanEmployee(identifier);
    return sendSuccess(res, result, "Employee verified successfully");
  } catch (error) {
    next(error);
  }
};

export const getNextDayServicesController = async (req, res, next) => {
  try {
    const result = KioskService.getNextDayServices();
    return sendSuccess(res, result, "Available meal services retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const getNextDayMenuController = async (req, res, next) => {
  try {
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : null;
    const result = KioskService.getNextDayMenu(serviceId);
    return sendSuccess(res, result, "Next day menu retrieved successfully");
  } catch (error) {
    next(error);
  }
};
