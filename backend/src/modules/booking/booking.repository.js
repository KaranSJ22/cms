import { pool } from "../../db/connection.js";

export const getBooking = async (bookingId) => {
  const [resultSets] = await pool.query("CALL CMSGETBOOK(?)", [bookingId]);
  return {
    HEADER: resultSets[0]?.[0] || null,
    ITEMS: resultSets[1] || [],
  };
};

export const listBookings = async ({
  PCUSTOMERID = null,
  PSERVICEID = null,
  PSTARTDATE = null,
  PENDDATE = null,
  PSTATUS = null,
}) => {
  const [resultSets] = await pool.query("CALL CMSLISTBOOK(?, ?, ?, ?, ?)", [
    PCUSTOMERID,
    PSERVICEID,
    PSTARTDATE,
    PENDDATE,
    PSTATUS,
  ]);
  return resultSets[0] || [];
};

export const createBooking = async ({
  PBOOKTYPECODE,
  PCUSTOMERID,
  PSERVICEID,
  PSERVICEDATE,
  PITEMSJSON,
  PBOOKEDBY,
  PREMARKS,
}) => {
  const [result] = await pool.query(
    "CALL CMSADDBOOK(?, ?, ?, ?, ?, ?, ?)",
    [
      PBOOKTYPECODE,
      PCUSTOMERID,
      PSERVICEID,
      PSERVICEDATE,
      JSON.stringify(PITEMSJSON),
      PBOOKEDBY,
      PREMARKS || null,
    ]
  );
  return result;
};

export const updateBookingItem = async ({
  PBOOKINGID,
  PBOOKDTID,
  PQTY,
  PSTATUS,
  PCHANGEDBY,
  PCHGREASON,
}) => {
  const [result] = await pool.query(
    "CALL CMSUPDBOOKITEM(?, ?, ?, ?, ?, ?)",
    [
      PBOOKINGID,
      PBOOKDTID,
      PQTY,
      PSTATUS,
      PCHANGEDBY,
      PCHGREASON || null,
    ]
  );
  return result;
};

export const cancelBooking = async ({
  PBOOKINGID,
  PCANCELLEDBY,
  PCANCELREASON,
}) => {
  const [result] = await pool.query(
    "CALL CMSCANCELBOOK(?, ?, ?)",
    [PBOOKINGID, PCANCELLEDBY, PCANCELREASON || null]
  );
  return result;
};

export const serveBooking = async ({
  PBOOKINGID,
  PSERVEDBY,
  PSERVEREASON,
}) => {
  const [result] = await pool.query(
    "CALL CMSSERVEBOOK(?, ?, ?)",
    [PBOOKINGID, PSERVEDBY, PSERVEREASON || null]
  );
  return result;
};

export const noShowBooking = async ({
  PBOOKINGID,
  PCHANGEDBY,
  PCHGREASON,
}) => {
  const [result] = await pool.query(
    "CALL CMSNOSHOWBOOK(?, ?, ?)",
    [PBOOKINGID, PCHANGEDBY, PCHGREASON || null]
  );
  return result;
};

export const toggleKiosk = async ({
  PDAYMENUID,
  PISKIOSK,
  PCHANGEDBY,
}) => {
  const [result] = await pool.query(
    "CALL CMSTOGGLEKIOSK(?, ?, ?)",
    [PDAYMENUID, PISKIOSK, PCHANGEDBY]
  );
  return result;
};
