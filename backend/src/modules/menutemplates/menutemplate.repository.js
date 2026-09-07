import { pool } from "../../db/connection.js";

export const addMenuTemplate = async ({
  PCANTEENID,
  PSERVICEID,
  PTPLNAME,
  PWEEKDAY,
  PCREATEDBY,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSADDMENUTPL(?, ?, ?, ?, ?)",
    [PCANTEENID, PSERVICEID, PTPLNAME, PWEEKDAY, PCREATEDBY]
  );
  return resultSets[0]?.[0] || null;
};

export const updateMenuTemplate = async ({
  PMENUTPLID,
  PTPLNAME,
  PWEEKDAY,
  PSTATUSCODE,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSUPDMENUTPL(?, ?, ?, ?)",
    [PMENUTPLID, PTPLNAME, PWEEKDAY, PSTATUSCODE]
  );
  return resultSets[0]?.[0] || null;
};

export const getMenuTemplate = async (PMENUTPLID) => {
  const [resultSets] = await pool.query("CALL CMSGETMENUTPL(?)", [PMENUTPLID]);
  return {
    HEADER: resultSets[0]?.[0] || null,
    ITEMS: resultSets[1] || [],
  };
};

export const listMenuTemplates = async ({ PCANTEENID = null, PSERVICEID = null }) => {
  const [resultSets] = await pool.query(
    "CALL CMSLISTMENUTPL(?, ?)",
    [PCANTEENID, PSERVICEID]
  );
  return resultSets[0] || [];
};

export const deactivateMenuTemplate = async (PMENUTPLID) => {
  const [resultSets] = await pool.query(
    "CALL CMSDEACTMENUTPL(?)",
    [PMENUTPLID]
  );
  return resultSets[0]?.[0] || null;
};

export const addMenuTemplateDt = async ({
  PMENUTPLID,
  PMENUITEMID,
  PISSPECIAL,
  PISPREBOOK,
  PISKIOSK,
  PMAXQTY,
  PDEFAVAILQTY,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSADDMENUTPLDT(?, ?, ?, ?, ?, ?, ?)",
    [PMENUTPLID, PMENUITEMID, PISSPECIAL, PISPREBOOK, PISKIOSK, PMAXQTY, PDEFAVAILQTY]
  );
  return resultSets[0]?.[0] || null;
};

export const removeMenuTemplateDt = async (PMENUTPLDTID) => {
  const [resultSets] = await pool.query(
    "CALL CMSREMOVEMENUTPLDT(?)",
    [PMENUTPLDTID]
  );
  return resultSets[0]?.[0] || null;
};

export const listMenuTemplateDt = async (PMENUTPLID) => {
  const [resultSets] = await pool.query(
    "CALL CMSLISTMENUTPLDT(?)",
    [PMENUTPLID]
  );
  return resultSets[0] || [];
};

export const bulkGenerateMenu = async ({
  PCANTEENID,
  PSERVICEID,
  PSTARTDATE,
  PENDDATE,
  PCREATEDBY,
}) => {
  const [resultSets] = await pool.query(
    "CALL CMSBULKGENERATEMENU(?, ?, ?, ?, ?)",
    [PCANTEENID, PSERVICEID, PSTARTDATE, PENDDATE, PCREATEDBY]
  );
  // Returns SELECT VTOTALSLOTS, VTOTALITEMS
  return resultSets[0]?.[0] || { TOTALSLOTS_CREATED: 0, TOTALITEMS_INSERTED: 0 };
};

export const draftMenuTemplate = async ({ PCANTEENID = null, PSERVICEID, PCOUNT = 6 }) => {
  const [resultSets] = await pool.query(
    "CALL CMSDRAFTMENUTPL(?, ?, ?)",
    [PCANTEENID, PSERVICEID, PCOUNT]
  );
  return resultSets[0] || [];
};
