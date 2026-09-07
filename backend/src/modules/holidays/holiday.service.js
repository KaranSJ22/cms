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

export const listHolidays = async (year) => {
  const result = await HolidayRepository.listHolidays(year);
  return result;
};

export const deactivateHoliday = async (id) => {
  const result = await HolidayRepository.deactivateHoliday(id);
  return result;
};
