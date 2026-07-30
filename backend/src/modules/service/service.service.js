import {
  createService as createServiceRepository,
  updateService as updateServiceRepository,
  getServices,
  getServiceById,
} from "./service.repository.js";

export const fetchServices = async () => {
  return await getServices();
};

export const fetchService = async (SERVICEID) => {
  const service = await getServiceById(SERVICEID);

  if (!service) {
    const error = new Error("Service not found");
    error.statusCode = 404;
    throw error;
  }

  return service;
};

export const createService = async (serviceData, createdByUserId) => {
  const created = await createServiceRepository({
    CANTEENID: serviceData.CANTEENID,
    SERVCODE: serviceData.SERVCODE,
    SERVNAME: serviceData.SERVNAME,
    DEFSTART: serviceData.DEFSTART,
    DEFEND: serviceData.DEFEND,
    CREATEDBY: createdByUserId,
  });

  if (!created?.SERVICEID) {
    const error = new Error("Service creation failed");
    error.statusCode = 500;
    throw error;
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
