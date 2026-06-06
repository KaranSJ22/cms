import {
  getAllStatus,
  getAllCustomerTypes,
  getAllScreens,
  getAllAutonos,
} from "./common.repository.js";

export const fetchStatus = async () => {
  return await getAllStatus();
};

export const fetchCustomerTypes = async () => {
  return await getAllCustomerTypes();
};

export const fetchScreens = async () => {
  return await getAllScreens();
};

export const fetchAutonos = async () => {
  return await getAllAutonos();
};