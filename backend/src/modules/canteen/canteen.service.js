import { NotFoundError } from "../../common/errors/appError.js";
import * as CanteenRepository from "./canteen.repository.js";

export const getCanteens = async (filters = {}) => {
  return await CanteenRepository.getCanteens(filters);
};

export const getCanteenById = async (canteenId) => {
  const canteen = await CanteenRepository.getCanteenById(canteenId);
  if (!canteen) {
    throw new NotFoundError(`Canteen with ID ${canteenId} not found`);
  }
  return canteen;
};

export const createCanteen = async (canteenData, userId) => {
  const result = await CanteenRepository.createCanteen({
    ...canteenData,
    USERID: userId,
  });
  return await getCanteenById(result.CANTEENID);
};

export const updateCanteen = async (canteenId, updateData) => {
  await CanteenRepository.updateCanteen({
    CANTEENID: canteenId,
    ...updateData,
  });
  return await getCanteenById(canteenId);
};

export const deactivateCanteen = async (canteenId) => {
  await CanteenRepository.deactivateCanteen(canteenId);
  return await getCanteenById(canteenId);
};

export const listCenters = async () => {
  return await CanteenRepository.listCenters();
};

export const createCenter = async (centerData) => {
  const result = await CanteenRepository.createCenter(centerData);
  return result;
};

/**
 * Resolves the CANTEENID associated with a given operational resource
 * (DAYSLOT, DAYMENU, or BOOKING).
 */
export const getResourceCanteenId = async (resourceType, id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;

  return await CanteenRepository.getResourceCanteenId(resourceType, numericId);
};
