import { sendSuccess } from "../../utils/apiResponse.js";
import * as HolidayService from "./holiday.service.js";

export const addHoliday = async (req, res, next) => {
  try {
    const data = { ...req.body, PCREATEDBY: req.user.USERID };
    const result = await HolidayService.addHoliday(data);
    sendSuccess(res, result, "Holiday created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const updateHoliday = async (req, res, next) => {
  try {
    const data = { ...req.body, PHOLIDAYID: parseInt(req.params.id, 10) };
    const result = await HolidayService.updateHoliday(data);
    sendSuccess(res, result, "Holiday updated successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getHoliday = async (req, res, next) => {
  try {
    const result = await HolidayService.getHoliday(parseInt(req.params.id, 10));
    sendSuccess(res, result, "Holiday fetched successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const listHolidays = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const result = await HolidayService.listHolidays(year);
    sendSuccess(res, result, "Holidays retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const deactivateHoliday = async (req, res, next) => {
  try {
    const result = await HolidayService.deactivateHoliday(parseInt(req.params.id, 10));
    sendSuccess(res, result, "Holiday deactivated successfully", 200);
  } catch (error) {
    next(error);
  }
};
