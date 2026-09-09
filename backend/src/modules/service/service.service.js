import {
  createService as createServiceRepository,
  updateService as updateServiceRepository,
  getServices,
  getServiceById,
} from "./service.repository.js";
import { NotFoundError, DatabaseError } from "../../common/errors/appError.js";

export const fetchServices = async () => {
  return await getServices();
};

export const fetchService = async (SERVICEID) => {
  const service = await getServiceById(SERVICEID);

  if (!service) {
    throw new NotFoundError("Service not found");
  }

  return service;
};

export const createService = async (serviceData, createdByUserId) => {
  const created = await createServiceRepository({
    SERVCODE: serviceData.SERVCODE,
    SERVNAME: serviceData.SERVNAME,
    DEFSTART: serviceData.DEFSTART,
    DEFEND: serviceData.DEFEND,
    CREATEDBY: createdByUserId,
  });

  if (!created?.SERVICEID) {
    throw new DatabaseError("Service creation failed");
  }


  return await getServiceById(created.SERVICEID);
};

export const updateService = async (
  SERVICEID,
  serviceData,
  changedByUserId
) => {
  await updateServiceRepository({
    SERVICEID,
    SERVNAME: serviceData.SERVNAME,
    DEFSTART: serviceData.DEFSTART,
    DEFEND: serviceData.DEFEND,
    STATUS: serviceData.STATUS,
    CHANGEDBY: changedByUserId,
    CHGREASON: serviceData.CHGREASON || null,
  });

  return await getServiceById(SERVICEID);
};
