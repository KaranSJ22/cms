import {
  createDaySlot as createDaySlotRepository,
  updateDaySlot as updateDaySlotRepository,
  getDaySlots,
  getDaySlotById,
} from "./dayslot.repository.js";

export const fetchDaySlots = async (params = {}) => {
  const CANTEENID = params.CANTEENID ?? params.canteenId ?? null;
  const SERVICEID = params.SERVICEID ?? params.serviceId ?? null;
  const DATEFROM = params.DATEFROM ?? params.dateFrom ?? params.servingDate ?? null;
  const DATETO = params.DATETO ?? params.dateTo ?? params.servingDate ?? null;

  return await getDaySlots({
    SERVICEID: SERVICEID ? Number(SERVICEID) : null,
    CANTEENID: CANTEENID ? Number(CANTEENID) : null,
    DATEFROM: DATEFROM || null,
    DATETO: DATETO || null,
  });
};

export const fetchDaySlot = async (DAYSLOTID) => {
  const daySlot = await getDaySlotById(DAYSLOTID);

  if (!daySlot) {
    const error = new Error("Day slot not found");
    error.statusCode = 404;
    throw error;
  }

  return daySlot;
};

export const createDaySlot = async (daySlotData, createdByUserId) => {
  const created = await createDaySlotRepository({
    CANTEENID: daySlotData.CANTEENID,
    SERVICEID: daySlotData.SERVICEID,
    SERVDATE: daySlotData.SERVDATE,
    STARTTIME: daySlotData.STARTTIME,
    ENDTIME: daySlotData.ENDTIME,
    CREATEDBY: createdByUserId,
  });

  if (!created?.DAYSLOTID) {
    const error = new Error("Day slot creation failed");
    error.statusCode = 500;
    throw error;
  }

  return await getDaySlotById(created.DAYSLOTID);
};

export const updateDaySlot = async (
  DAYSLOTID,
  daySlotData,
  changedByUserId
) => {
  await updateDaySlotRepository({
    DAYSLOTID,
    STARTTIME: daySlotData.STARTTIME,
    ENDTIME: daySlotData.ENDTIME,
    STATUS: daySlotData.STATUS || 'ACT',
    CHANGEDBY: changedByUserId,
    CHGREASON: daySlotData.CHGREASON || null,
  });

  return await getDaySlotById(DAYSLOTID);
};
