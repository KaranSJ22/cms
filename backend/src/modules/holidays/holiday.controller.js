import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as HolidayService from "./holiday.service.js";
import { getCurrentYearIST } from "../../utils/dateTime.js";

export const addHoliday = asyncHandler(async (req, res) => {
  const data = { ...req.body, PCREATEDBY: req.user.USERID };
  const result = await HolidayService.addHoliday(data);
  return sendSuccess(res, result, "Holiday created successfully", 201);
});

export const updateHoliday = asyncHandler(async (req, res) => {
  const data = { ...req.body, PHOLIDAYID: parseInt(req.params.id, 10) };
  const result = await HolidayService.updateHoliday(data);
  return sendSuccess(res, result, "Holiday updated successfully", 200);
});

export const getHoliday = asyncHandler(async (req, res) => {
  const result = await HolidayService.getHoliday(parseInt(req.params.id, 10));
  return sendSuccess(res, result, "Holiday fetched successfully", 200);
});

export const listHolidays = asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : getCurrentYearIST();
  const includeInactive = req.query.includeInactive === "true";
  const result = await HolidayService.listHolidays(year, includeInactive);
  return sendSuccess(res, result, "Holidays retrieved successfully", 200);
});

export const deactivateHoliday = asyncHandler(async (req, res) => {
  const result = await HolidayService.deactivateHoliday(parseInt(req.params.id, 10));
  return sendSuccess(res, result, "Holiday deactivated successfully", 200);
});
