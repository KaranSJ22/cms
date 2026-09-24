import * as HolidayRepository from "./holiday.repository.js";
import { NotFoundError } from "../../common/errors/appError.js";

export const addHoliday = async (data) => {
  const result = await HolidayRepository.addHoliday(data);
  return result;
};

export const updateHoliday = async (data) => {
  const result = await HolidayRepository.updateHoliday(data);
  return result;
};

export const getHoliday = async (id) => {
  const result = await HolidayRepository.getHoliday(id);
  if (!result) {
    throw new NotFoundError(`Holiday with ID ${id} not found.`);
  }
  return result;
};

export const listHolidays = async (year, includeInactive = false) => {
  const result = await HolidayRepository.listHolidays(year);
  if (includeInactive) {
    return result;
  }
  return (result || []).filter(
    (h) => h.STATUSCODE === "ACT" || h.STATUSID === 10
  );
};

export const deactivateHoliday = async (id) => {
  const result = await HolidayRepository.deactivateHoliday(id);
  return result;
};
