import {
  createDaySlot as createDaySlotRepository,
  updateDaySlot as updateDaySlotRepository,
  getDaySlots,
  getDaySlotById,
} from "./dayslot.repository.js";
import { NotFoundError, DatabaseError } from "../../common/errors/appError.js";

export const fetchDaySlots = async (params = {}) => {
  const DAYSLOTID = params.DAYSLOTID ?? params.daySlotId ?? null;
  if (DAYSLOTID) {
    const slot = await getDaySlotById(Number(DAYSLOTID));
    return slot ? [slot] : [];
  }

  const CANTEENID = params.CANTEENID ?? params.canteenId ?? null;
  const SERVICEID = params.SERVICEID ?? params.serviceId ?? null;
  const DATEFROM = params.DATEFROM ?? params.dateFrom ?? params.servingDate ?? null;
  const DATETO = params.DATETO ?? params.dateTo ?? params.servingDate ?? null;
  const PAGE = params.PAGE ?? params.page ?? null;
  const PAGESIZE = params.PAGESIZE ?? params.pageSize ?? null;

  const rows = await getDaySlots({
    SERVICEID: SERVICEID ? Number(SERVICEID) : null,
    CANTEENID: CANTEENID ? Number(CANTEENID) : null,
    DATEFROM: DATEFROM || null,
    DATETO: DATETO || null,
    PAGE: PAGE ? Number(PAGE) : null,
    PAGESIZE: PAGESIZE ? Number(PAGESIZE) : null,
  });

  if (PAGE && PAGESIZE) {
    const totalRows = rows[0]?.TOTALROWS || 0;
    const totalPages =
      rows[0]?.TOTALPAGES ||
      (totalRows > 0 ? Math.ceil(totalRows / Number(PAGESIZE)) : 1);
    const currentPage = rows[0]?.CURRENTPAGE || Number(PAGE) || 1;
    const limit = rows[0]?.PAGESIZE || Number(PAGESIZE) || 20;

    return {
      rows,
      pagination: {
        totalRows: Number(totalRows),
        currentPage: Number(currentPage),
        pageSize: Number(limit),
        totalPages: Number(totalPages),
      },
    };
  }

  return rows;
};

export const fetchDaySlot = async (DAYSLOTID) => {
  const daySlot = await getDaySlotById(DAYSLOTID);

  if (!daySlot) {
    throw new NotFoundError("Day slot not found");
  }

  return daySlot;
};

export const createDaySlot = async (daySlotData, createdByUserId) => {
  const created = await createDaySlotRepository({
    CANTEENID: daySlotData.CANTEENID,
    SERVICEID: daySlotData.SERVICEID,
    SERVDATE: daySlotData.SERVDATE || daySlotData.SERVICEDATE,
    SERVICEDATE: daySlotData.SERVICEDATE || daySlotData.SERVDATE,
    STARTTIME: daySlotData.STARTTIME,
    ENDTIME: daySlotData.ENDTIME,
    CREATEDBY: createdByUserId,
  });

  if (!created?.DAYSLOTID) {
    throw new DatabaseError("Day slot creation failed");
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
