import { pool } from "../../db/connection.js";
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
 * NOTE: to be converted to stored procedure later
 */
export const getResourceCanteenId = async (resourceType, id) => {
  if (!id) return null;

  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return null;

  // to be converted to stored procedure later
  if (resourceType === "DAYSLOT") {
    const [rows] = await pool.query(
      "SELECT CANTEENID FROM CMS_DAYSLOT WHERE DAYSLOTID = ? LIMIT 1",
      [numericId]
    );
    return rows[0]?.CANTEENID || null;
  }

  // to be converted to stored procedure later
  if (resourceType === "DAYMENU") {
    const [rows] = await pool.query(
      `SELECT DS.CANTEENID 
       FROM CMS_DAYMENU DM 
       JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID 
       WHERE DM.DAYMENUID = ? LIMIT 1`,
      [numericId]
    );
    return rows[0]?.CANTEENID || null;
  }

  // to be converted to stored procedure later
  if (resourceType === "BOOKING") {
    const [rows] = await pool.query(
      `SELECT DS.CANTEENID 
       FROM CMS_BOOKITEM BI 
       JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID 
       JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID 
       WHERE BI.BOOKID = ? LIMIT 1`,
      [numericId]
    );
    return rows[0]?.CANTEENID || null;
  }

  return null;
};
