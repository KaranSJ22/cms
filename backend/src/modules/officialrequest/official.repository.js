import { pool } from "../../db/connection.js";

/**
 * Official Request Repository
 * Centralized data access layer for official catering requests, combos, and workflows.
 * 100% Stored Procedures (SPs) — Zero raw SQL queries and zero fallback queries.
 */

// ============================================================
// 1. SERVICES & COMBOS (CANTEEN MANAGER)
// ============================================================

export const listServicesByCanteen = async (canteenId, statusId = null) => {
  const [res] = await pool.query("CALL CMSOFFLISTSERVICES(?, ?)", [
    canteenId,
    statusId || null,
  ]);
  const services = res[0] || [];
  const combos = res[1] || [];
  const comboItems = res[2] || [];

  const itemsByCombo = {};
  for (const item of comboItems) {
    if (!itemsByCombo[item.OFFCOMBOID]) {
      itemsByCombo[item.OFFCOMBOID] = [];
    }
    itemsByCombo[item.OFFCOMBOID].push(item);
  }

  const combosByService = {};
  for (const combo of combos) {
    combo.ITEMS = itemsByCombo[combo.OFFCOMBOID] || [];
    if (!combosByService[combo.OFFSERVID]) {
      combosByService[combo.OFFSERVID] = [];
    }
    combosByService[combo.OFFSERVID].push(combo);
  }

  return services.map((s) => ({
    ...s,
    COMBOS: combosByService[s.OFFSERVID] || [],
  }));
};

export const getServiceDetails = async (serviceId) => {
  const [res] = await pool.query("CALL CMSOFFGETSERVICE(?)", [serviceId]);
  const service = res[0]?.[0];
  if (!service) return null;

  const combos = res[1] || [];
  const items = res[2] || [];

  const itemsByCombo = {};
  for (const item of items) {
    if (!itemsByCombo[item.OFFCOMBOID]) itemsByCombo[item.OFFCOMBOID] = [];
    itemsByCombo[item.OFFCOMBOID].push(item);
  }

  service.COMBOS = combos.map((c) => ({
    ...c,
    ITEMS: itemsByCombo[c.OFFCOMBOID] || [],
  }));

  return service;
};

export const createService = async (serviceData, userId) => {
  const { CANTEENID, SERVNAME, DESCR, CUTOFFHOURS, REQAPPRLVL } = serviceData;
  const [res] = await pool.query(
    "CALL CMSOFFCREATESERVICE(?, ?, ?, ?, ?, ?)",
    [
      CANTEENID,
      SERVNAME,
      DESCR || null,
      CUTOFFHOURS || 24,
      REQAPPRLVL || "L1",
      userId,
    ]
  );
  const insertId = res[0]?.[0]?.OFFSERVID;
  return await getServiceDetails(insertId);
};

export const updateService = async (serviceId, updateData, userId) => {
  const { SERVNAME, DESCR, CUTOFFHOURS, REQAPPRLVL, STATUSID } = updateData;
  await pool.query(
    "CALL CMSOFFUPDATESERVICE(?, ?, ?, ?, ?, ?, ?)",
    [
      serviceId,
      SERVNAME !== undefined ? SERVNAME : null,
      DESCR !== undefined ? DESCR : null,
      CUTOFFHOURS !== undefined ? CUTOFFHOURS : null,
      REQAPPRLVL !== undefined ? REQAPPRLVL : null,
      STATUSID !== undefined ? STATUSID : null,
      userId,
    ]
  );
  return await getServiceDetails(serviceId);
};

export const createCombo = async (comboData, userId) => {
  const { OFFSERVID, COMBONAME, DESCR, GROSSPRICE, HANDLINGCHARGE, COMBOPRICE, ITEMS } = comboData;
  const grossVal = Number(GROSSPRICE !== undefined ? GROSSPRICE : (COMBOPRICE || 0));
  const handlingVal = Number(HANDLINGCHARGE !== undefined ? HANDLINGCHARGE : 0.0);
  const comboPriceVal = Number((grossVal + handlingVal).toFixed(2));
  const itemsJson = ITEMS && ITEMS.length > 0 ? JSON.stringify(ITEMS) : null;

  const [res] = await pool.query(
    "CALL CMSOFFCREATECOMBO(?, ?, ?, ?, ?, ?, ?, ?)",
    [
      OFFSERVID,
      COMBONAME,
      DESCR || null,
      grossVal,
      handlingVal,
      comboPriceVal,
      itemsJson,
      userId,
    ]
  );
  return res[0]?.[0]?.OFFCOMBOID;
};

export const updateCombo = async (comboId, updateData, userId) => {
  const grossVal = updateData.GROSSPRICE !== undefined ? Number(updateData.GROSSPRICE) : null;
  const handlingVal = updateData.HANDLINGCHARGE !== undefined ? Number(updateData.HANDLINGCHARGE) : null;
  const comboPriceVal = updateData.COMBOPRICE !== undefined ? Number(updateData.COMBOPRICE) : null;
  const itemsJson = updateData.ITEMS ? JSON.stringify(updateData.ITEMS) : null;

  await pool.query(
    "CALL CMSOFFUPDATECOMBO(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      comboId,
      updateData.COMBONAME || null,
      updateData.DESCR || null,
      grossVal,
      handlingVal,
      comboPriceVal,
      updateData.STATUSID || null,
      itemsJson,
      userId,
    ]
  );
  return true;
};

export const deleteCombo = async (comboId, userId) => {
  await pool.query("CALL CMSOFFDELETECOMBO(?, ?)", [comboId, userId]);
  return true;
};

export const listAvailableMenuItems = async (canteenId = null) => {
  const [res] = await pool.query("CALL CMSOFFLISTMENUITEMS(?)", [canteenId || null]);
  return (res[0] || []).map((r) => ({
    ...r,
    UNITPRICE: Number(r.OFFPRICE),
  }));
};

// ============================================================
// 2. LEVEL MAPPINGS & APPROVER ELIGIBILITY
// ============================================================

export const listLevelMappings = async () => {
  const [res] = await pool.query("CALL CMSOFFLISTLEVELMAPS()");
  return res[0] || [];
};

export const upsertLevelMapping = async ({ EMPLEVEL, APPRLVL, ISACTIVE = 1 }, userId) => {
  await pool.query("CALL CMSOFFUPSERTLEVELMAP(?, ?, ?, ?)", [
    EMPLEVEL,
    APPRLVL,
    ISACTIVE ?? 1,
    userId,
  ]);
  return await listLevelMappings();
};

export const getEligibleApprovers = async (apprLvl, requesterUserId) => {
  const [res] = await pool.query("CALL CMSOFFGETAPPROVERS(?, ?)", [
    apprLvl || null,
    requesterUserId || null,
  ]);
  return res[0] || [];
};

export const getApproverLevel = async (approverUserId) => {
  const [res] = await pool.query("CALL CMSOFFGETAPPROVERLEVEL(?)", [approverUserId]);
  return res[0]?.[0] || null;
};

// ============================================================
// 3. BOOKING CREATION (EMPLOYEE)
// ============================================================

export const createOfficialBooking = async ({
  canteenId,
  offServId,
  offComboId,
  customerId,
  userId,
  purpose,
  venue,
  eventDateTimeIST,
  quantity,
  noOfPeople,
  apprLvl,
  approverId,
  grossUnitPrice,
  handlingCharge,
  totalAmount,
}) => {
  const [res] = await pool.query(
    "CALL CMSOFFCREATEBOOKING(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      Number(canteenId),
      Number(offServId),
      Number(offComboId),
      Number(customerId),
      Number(userId),
      purpose,
      venue,
      eventDateTimeIST,
      Number(quantity),
      Number(noOfPeople),
      apprLvl || null,
      Number(approverId),
    ]
  );
  const row = res[0]?.[0];
  return {
    OFFBOOKID: row?.OFFBOOKID,
    BOOKNO: row?.BOOKNO,
    STATUS: row?.STATUS || "Submitted",
    UNITPRICE: Number(row?.UNITPRICE ?? grossUnitPrice),
    HANDLINGCHARGE: Number(row?.HANDLINGCHARGE ?? handlingCharge),
    TOTALAMOUNT: Number(row?.TOTALAMOUNT ?? totalAmount),
  };
};

export const getOfficialBookingById = async (bookingId) => {
  const [res] = await pool.query("CALL CMSOFFGETBOOKING(?)", [bookingId]);
  const booking = res[0]?.[0];
  if (!booking) return null;

  booking.ITEMS = res[1] || [];
  booking.HISTORY = res[2] || [];
  return booking;
};

export const listMyOfficialBookings = async (customerId) => {
  const [res] = await pool.query("CALL CMSOFFLISTMYBOOKINGS(?)", [customerId]);
  return res[0] || [];
};

// ============================================================
// 4. APPROVER WORKFLOW
// ============================================================

export const listAssignedApprovals = async (approverUserId) => {
  const [res] = await pool.query("CALL CMSOFFLISTASSIGNEDAPPR(?)", [approverUserId]);
  return res[0] || [];
};

export const processApproverAction = async ({ bookingId, action, rejReason, approverUserId }) => {
  const spAction = action === "APPROVE" ? "FORWARD" : action;
  const [res] = await pool.query("CALL CMSOFFPROCESSAPPROVER(?, ?, ?, ?)", [
    bookingId,
    spAction,
    rejReason || null,
    approverUserId,
  ]);
  const row = res[0]?.[0];
  const nextStatus = (action === "APPROVE" || action === "FORWARD") ? 36 : 38;
  const actionLabel = action === "APPROVE" ? "APPROVED" : (action === "FORWARD" ? "FORWARDED" : "REJECTED");
  return {
    OFFBOOKID: row?.OFFBOOKID || bookingId,
    ACTION: row?.ACTION || actionLabel,
    STATUSID: row?.STATUSID || nextStatus,
  };
};

// ============================================================
// 5. CANTEEN MANAGER WORKFLOW
// ============================================================

export const listManagerPendingBookings = async (canteenId) => {
  const [res] = await pool.query("CALL CMSOFFLISTMGRPENDING(?)", [canteenId]);
  return res[0] || [];
};

export const processManagerAction = async ({ bookingId, action, rejReason, managerUserId }) => {
  const [res] = await pool.query("CALL CMSOFFPROCESSMANAGER(?, ?, ?, ?)", [
    bookingId,
    action,
    rejReason || null,
    managerUserId,
  ]);
  const row = res[0]?.[0];
  const nextStatus = action === "ACCEPT" ? 37 : 38;
  const actionLabel = action === "ACCEPT" ? "CONFIRMED" : "REJECTED";
  return {
    OFFBOOKID: row?.OFFBOOKID || bookingId,
    ACTION: row?.ACTION || row?.ACTIONCODE || actionLabel,
    STATUSID: row?.STATUSID || nextStatus,
  };
};

// ============================================================
// 6. RESUBMISSION (EMPLOYEE)
// ============================================================

export const resubmitOfficialBooking = async ({
  bookingId,
  newComboId,
  purpose,
  venue,
  eventDateTimeIST,
  quantity,
  noOfPeople,
  approverId,
  userId,
}) => {
  const [res] = await pool.query(
    "CALL CMSOFFRESUBMITBOOKING(?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      Number(bookingId),
      newComboId ? Number(newComboId) : null,
      purpose || null,
      venue || null,
      eventDateTimeIST || null,
      quantity ? Number(quantity) : null,
      noOfPeople ? Number(noOfPeople) : null,
      approverId ? Number(approverId) : null,
      Number(userId),
    ]
  );
  return res[0]?.[0];
};

// ============================================================
// 7. KITCHEN PREPARATION & CONFIRMED ORDERS FULFILLMENT
// ============================================================

export const listConfirmedOfficialBookings = async (canteenId, { date, fromDate, toDate } = {}) => {
  const startDate = date || fromDate || null;
  const endDate = date || toDate || null;

  const [res] = await pool.query("CALL CMSOFFLISTCONFIRMED(?, ?, ?)", [
    canteenId,
    startDate,
    endDate,
  ]);
  const bookings = res[0] || [];
  const items = res[1] || [];

  const itemsByCombo = {};
  for (const it of items) {
    if (!itemsByCombo[it.OFFCOMBOID]) itemsByCombo[it.OFFCOMBOID] = [];
    itemsByCombo[it.OFFCOMBOID].push(it);
  }

  return bookings.map((b) => {
    const comboItems = itemsByCombo[b.OFFCOMBOID] || [];
    return {
      ...b,
      ITEMS: comboItems.map((ci) => ({
        ...ci,
        TOTAL_PREP_QTY: Number(ci.QTY || 1) * Number(b.QUANTITY || 1),
      })),
    };
  });
};

export const getOfficialKitchenPrepSummary = async (canteenId, targetDate) => {
  const [res] = await pool.query("CALL CMSOFFGETKITCHENPREP(?, ?)", [
    canteenId,
    targetDate,
  ]);
  const dishRows = res[0] || [];
  const breakdownRows = res[1] || [];
  const statsRows = res[2] || [];

  const breakdownByDish = {};
  for (const row of breakdownRows) {
    if (!breakdownByDish[row.MENUITEMID]) breakdownByDish[row.MENUITEMID] = [];
    breakdownByDish[row.MENUITEMID].push(row);
  }

  const dishesWithOrders = dishRows.map((d) => ({
    ...d,
    ITEMID: d.MENUITEMID,
    TOTAL_PREP_QTY: Number(d.TOTAL_PREP_QTY || 0),
    ORDER_COUNT: Number(d.ORDER_COUNT || 0),
    TOTAL_ORDERS_COUNT: Number(d.ORDER_COUNT || 0),
    PREP_STATUS: d.PREP_STATUS || "PENDING",
    ORDERS: breakdownByDish[d.MENUITEMID] || [],
  }));

  const totalEvents = Number(statsRows[0]?.TOTAL_EVENTS || 0);
  const totalServings = Number(statsRows[0]?.TOTAL_SERVINGS || 0);

  return {
    DATE: targetDate,
    TARGETDATE: targetDate,
    CANTEENID: Number(canteenId),
    TOTAL_BOOKINGS: totalEvents,
    TOTAL_PAX: totalServings,
    SUMMARY: statsRows[0] || {
      TOTAL_EVENTS: 0,
      TOTAL_SERVINGS: 0,
      TOTAL_ATTENDEES: 0,
      EARLIEST_EVENT: null,
    },
    DISHES: dishesWithOrders,
  };
};

export const updateBookingFulfillment = async (bookingId, status, userId) => {
  const bId = Number(bookingId);
  const uId = Number(userId);
  const [res] = await pool.query("CALL CMSOFFUPDATEFULFILLMENT(?, ?, ?)", [
    bId,
    status,
    uId,
  ]);
  return res[0]?.[0] || null;
};

export const updateDishPrepStatus = async (canteenId, date, menuItemId, status, userId) => {
  const cId = Number(canteenId);
  const mId = Number(menuItemId);
  const uId = Number(userId);
  const upperStatus = status.toUpperCase();

  const [res] = await pool.query("CALL CMSOFFUPDATEDISHPREP(?, ?, ?, ?, ?)", [
    cId,
    date,
    mId,
    upperStatus,
    uId,
  ]);
  return res[0]?.[0] || null;
};

// ============================================================
// 8. CANTEEN & ENTITY RESOLUTION HELPERS (FOR RBAC & VALIDATION)
// ============================================================

export const getServiceById = async (serviceId) => {
  const id = Number(serviceId);
  if (!id) return null;
  const [res] = await pool.query("CALL CMSOFFGETSERVICEHEADER(?)", [id]);
  return res[0]?.[0] || null;
};

export const getComboById = async (comboId) => {
  const id = Number(comboId);
  if (!id) return null;
  const [res] = await pool.query("CALL CMSOFFGETCOMBOHEADER(?)", [id]);
  return res[0]?.[0] || null;
};

export const getBookingHeaderById = async (bookingId) => {
  const id = Number(bookingId);
  if (!id) return null;
  const [res] = await pool.query("CALL CMSOFFGETBOOKINGHEADER(?)", [id]);
  return res[0]?.[0] || null;
};

export const getCanteenIdByServiceId = async (serviceId) => {
  const service = await getServiceById(serviceId);
  return service?.CANTEENID || null;
};

export const getCanteenIdByComboId = async (comboId) => {
  const combo = await getComboById(comboId);
  return combo?.CANTEENID || null;
};

export const getCanteenIdByBookingId = async (bookingId) => {
  const booking = await getBookingHeaderById(bookingId);
  return booking?.CANTEENID || null;
};
