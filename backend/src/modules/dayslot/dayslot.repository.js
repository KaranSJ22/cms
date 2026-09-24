import { pool } from "../../db/connection.js";

export const getDaySlots = async ({
  SERVICEID = null,
  CANTEENID = null,
  DATEFROM = null,
  DATETO = null,
  PAGE = null,
  PAGESIZE = null,
} = {}) => {
  let resultSets;
  let isLegacySp = false;

  try {
    const [res] = await pool.execute("CALL CMSLISTSLOT(?, ?, ?, ?, ?, ?)", [
      SERVICEID,
      CANTEENID,
      DATEFROM,
      DATETO,
      PAGE ? Number(PAGE) : null,
      PAGESIZE ? Number(PAGESIZE) : null,
    ]);
    resultSets = res;
  } catch (err) {
    if (err.code === "ER_SP_WRONG_NO_OF_ARGS" || err.errno === 1318) {
      const [res] = await pool.execute("CALL CMSLISTSLOT(?, ?, ?, ?)", [
        SERVICEID,
        CANTEENID,
        DATEFROM,
        DATETO,
      ]);
      resultSets = res;
      isLegacySp = true;
    } else {
      throw err;
    }
  }

  const rows = resultSets[0] || [];
  if (PAGE && PAGESIZE) {
    if (isLegacySp) {
      const totalRows = rows.length;
      const limit = Number(PAGESIZE) || 20;
      const currentPage = Number(PAGE) || 1;
      const totalPages = totalRows > 0 ? Math.ceil(totalRows / limit) : 1;
      const offset = (currentPage - 1) * limit;
      const pagedRows = rows.slice(offset, offset + limit);

      return {
        rows: pagedRows,
        pagination: {
          totalRows,
          currentPage,
          pageSize: limit,
          totalPages,
        },
      };
    }

    const totalRows = rows[0]?.TOTALROWS || 0;
    const totalPages = rows[0]?.TOTALPAGES || (totalRows > 0 ? Math.ceil(totalRows / Number(PAGESIZE)) : 1);
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

export const getDaySlotById = async (DAYSLOTID) => {
  const [resultSets] = await pool.execute("CALL CMSGETSLOT(?)", [DAYSLOTID]);

  return resultSets[0]?.[0] || null;
};

export const createDaySlot = async ({
  CANTEENID,
  SERVICEID,
  SERVDATE,
  STARTTIME,
  ENDTIME,
  CREATEDBY,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDSLOT(?, ?, ?, ?, ?, ?)",
    [CANTEENID, SERVICEID, SERVDATE, STARTTIME, ENDTIME, CREATEDBY]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const updateDaySlot = async ({
  DAYSLOTID,
  STARTTIME,
  ENDTIME,
  STATUS,
  CHANGEDBY,
  CHGREASON = null,
}) => {
  await pool.execute("CALL CMSUPDSLOT(?, ?, ?, ?, ?, ?)", [
    DAYSLOTID,
    STARTTIME,
    ENDTIME,
    STATUS,
    CHANGEDBY,
    CHGREASON,
  ]);

  return true;
};
