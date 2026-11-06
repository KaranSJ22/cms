import dayjs from "dayjs";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../common/errors/appError.js";
import { logger } from "../../utils/logger.js";
import {
  TIMEZONE_IST,
  getNowIST,
  toMySQLDateTime,
} from "../../utils/dateTime.js";
import * as officialRepo from "./official.repository.js";

// Status IDs corresponding to CMS_STATUS seed
const STATUS = {
  ACTIVE: 10,
  DISABLED: 11,
  SUBMITTED: 35,
  PENDING_MANAGER: 36,
  CONFIRMED: 37,
  REJECTED: 38,
};

// ============================================================
// 1. SERVICES & COMBOS (CANTEEN MANAGER)
// ============================================================

export const listServicesByCanteen = async (canteenId, statusId = null) => {
  return await officialRepo.listServicesByCanteen(canteenId, statusId);
};

export const getServiceDetails = async (serviceId) => {
  const service = await officialRepo.getServiceDetails(serviceId);
  if (!service) {
    throw new NotFoundError("Official Service not found");
  }
  return service;
};

export const createService = async (serviceData, userId) => {
  return await officialRepo.createService(serviceData, userId);
};

export const updateService = async (serviceId, updateData, userId) => {
  return await officialRepo.updateService(serviceId, updateData, userId);
};

export const createCombo = async (comboData, userId) => {
  return await officialRepo.createCombo(comboData, userId);
};

export const updateCombo = async (comboId, updateData, userId) => {
  return await officialRepo.updateCombo(comboId, updateData, userId);
};

export const deleteCombo = async (comboId, userId) => {
  return await officialRepo.deleteCombo(comboId, userId);
};

export const listAvailableMenuItems = async (canteenId) => {
  return await officialRepo.listAvailableMenuItems(canteenId);
};

// ============================================================
// 2. LEVEL MAPPINGS & APPROVER ELIGIBILITY
// ============================================================

export const listLevelMappings = async () => {
  return await officialRepo.listLevelMappings();
};

export const upsertLevelMapping = async (data, userId) => {
  return await officialRepo.upsertLevelMapping(data, userId);
};

export const getEligibleApprovers = async (apprLvl, requesterUserId) => {
  return await officialRepo.getEligibleApprovers(apprLvl, requesterUserId);
};

// ============================================================
// 3. BOOKING CREATION & NUMBER GENERATION (EMPLOYEE)
// ============================================================

export const createOfficialBooking = async (bookingData, user) => {
  const {
    CANTEENID,
    OFFSERVID,
    OFFCOMBOID,
    PURPOSE,
    VENUE,
    EVENTDATETIME,
    QUANTITY,
    NOOFPEOPLE,
    APPRLVL,
    APPROVERID,
  } = bookingData;

  // 1. Permanent Employee Verification
  if (user.CTYPECODE !== "PRM") {
    throw new ForbiddenError("Only permanent employees can create Official Bookings");
  }

  // 2. Self-Approval Prevention
  if (Number(APPROVERID) === Number(user.USERID)) {
    throw new BadRequestError("Self-approval is not allowed. Please select another eligible approver.");
  }

  // 3. Check service, approval level and cutoff
  const service = await officialRepo.getServiceById(OFFSERVID);
  if (!service || service.STATUSID !== STATUS.ACTIVE) {
    throw new BadRequestError("The requested Official Service is not active or does not exist");
  }

  // Verify approver eligibility against service required level
  const approver = await officialRepo.getApproverLevel(APPROVERID);
  const approverTier = approver?.APPRLVL;
  if (!approverTier) {
    throw new BadRequestError("Selected approver is not mapped to an active approval level");
  }
  if (service.REQAPPRLVL === "L2" && approverTier !== "L2") {
    throw new BadRequestError("This service requires Level 2 approval. You must select a Level 2 approver.");
  }

  const eventDateTimeIST = toMySQLDateTime(EVENTDATETIME);
  const eventTime = dayjs.tz(eventDateTimeIST, TIMEZONE_IST).valueOf();
  const leadTimeHours = (eventTime - getNowIST().valueOf()) / (1000 * 60 * 60);

  if (leadTimeHours < service.CUTOFFHOURS) {
    throw new BadRequestError(
      `Booking cutoff violation: ${service.SERVNAME} requires at least ${service.CUTOFFHOURS} hours notice prior to the event.`
    );
  }

  // 4. Validate combo and price calculation
  // Formula: Total = (Quantity * Gross Price) + Handling Charges
  const combo = await officialRepo.getComboById(OFFCOMBOID);
  if (!combo || combo.STATUSID !== STATUS.ACTIVE || Number(combo.OFFSERVID) !== Number(OFFSERVID)) {
    throw new BadRequestError("The selected combo is not active or does not belong to this service");
  }

  const grossUnitPrice = Number(combo.GROSSPRICE !== undefined && combo.GROSSPRICE !== null ? combo.GROSSPRICE : combo.COMBOPRICE);
  const handlingCharge = Number(combo.HANDLINGCHARGE || 0);
  const totalAmount = Number(((Number(QUANTITY) * grossUnitPrice) + handlingCharge).toFixed(2));

  // 5. Execute transactional insert via repository
  const result = await officialRepo.createOfficialBooking({
    canteenId: CANTEENID,
    offServId: OFFSERVID,
    offComboId: OFFCOMBOID,
    customerId: user.CUSTOMERID,
    userId: user.USERID,
    purpose: PURPOSE,
    venue: VENUE,
    eventDateTimeIST,
    quantity: QUANTITY,
    noOfPeople: NOOFPEOPLE,
    apprLvl: APPRLVL || approverTier,
    approverId: APPROVERID,
    grossUnitPrice,
    handlingCharge,
    totalAmount,
  });

  logger.info({ bookingId: result.OFFBOOKID, bookNo: result.BOOKNO, userId: user.USERID }, "Official booking created successfully");

  return result;
};

export const getOfficialBookingById = async (bookingId) => {
  const booking = await officialRepo.getOfficialBookingById(bookingId);
  if (!booking) {
    throw new NotFoundError("Official Booking not found");
  }
  return booking;
};

export const listMyOfficialBookings = async (customerId) => {
  return await officialRepo.listMyOfficialBookings(customerId);
};

// ============================================================
// 4. APPROVER WORKFLOW
// ============================================================

export const listAssignedApprovals = async (approverUserId) => {
  return await officialRepo.listAssignedApprovals(approverUserId);
};

export const processApproverAction = async ({ bookingId, action, rejReason, approverUserId }) => {
  const booking = await officialRepo.getBookingHeaderById(bookingId);
  if (!booking) {
    throw new NotFoundError("Official Booking not found");
  }

  if (Number(booking.APPROVERID) !== Number(approverUserId)) {
    throw new ForbiddenError("You are not the designated approver for this booking");
  }

  if (booking.STATUSID !== STATUS.SUBMITTED) {
    throw new BadRequestError("This booking is no longer pending approver action");
  }

  const result = await officialRepo.processApproverAction({
    bookingId,
    action,
    rejReason,
    approverUserId,
  });

  logger.info({ bookingId, action, approverUserId }, "Approver processed official booking");

  return result;
};

// ============================================================
// 5. CANTEEN MANAGER WORKFLOW
// ============================================================

export const listManagerPendingBookings = async (canteenId) => {
  return await officialRepo.listManagerPendingBookings(canteenId);
};

export const processManagerAction = async ({ bookingId, action, rejReason, managerUserId, canteenRoles }) => {
  const booking = await officialRepo.getBookingHeaderById(bookingId);
  if (!booking) {
    throw new NotFoundError("Official Booking not found");
  }

  // Check manager canteen authorization
  const isAuthorized = (canteenRoles || []).some(
    (r) => r.CANTEENID === booking.CANTEENID && r.ROLECODE === "CNTMGR"
  );
  if (!isAuthorized) {
    throw new ForbiddenError("You are not authorized to manage bookings for this canteen");
  }

  if (booking.STATUSID !== STATUS.PENDING_MANAGER) {
    throw new BadRequestError("This booking is not awaiting Canteen Manager confirmation");
  }

  const result = await officialRepo.processManagerAction({
    bookingId,
    action,
    rejReason,
    managerUserId,
  });

  logger.info({ bookingId, action, managerUserId }, "Canteen manager processed official booking");

  return result;
};

// ============================================================
// 6. RESUBMISSION (EMPLOYEE)
// ============================================================

export const resubmitOfficialBooking = async (bookingId, updatedData, user) => {
  const booking = await officialRepo.getBookingHeaderById(bookingId);
  if (!booking) {
    throw new NotFoundError("Official Booking not found");
  }

  if (Number(booking.BOOKEDBY) !== Number(user.USERID)) {
    throw new ForbiddenError("You can only resubmit your own bookings");
  }

  if (booking.STATUSID !== STATUS.REJECTED) {
    throw new BadRequestError("Only rejected bookings can be modified and resubmitted");
  }

  // New values or existing fallbacks
  const newEventTimeStr = updatedData.EVENTDATETIME || booking.EVENTDATETIME;
  const newApproverId = updatedData.APPROVERID || booking.APPROVERID;
  const newComboId = updatedData.OFFCOMBOID || booking.OFFCOMBOID;
  const newQty = updatedData.QUANTITY !== undefined ? Number(updatedData.QUANTITY) : Number(booking.QUANTITY);

  // Self-approval prevention
  if (Number(newApproverId) === Number(user.USERID)) {
    throw new BadRequestError("Self-approval is not allowed. Please select another eligible approver.");
  }

  // Verify approver tier
  const approver = await officialRepo.getApproverLevel(newApproverId);
  const approverTier = approver?.APPRLVL;
  if (!approverTier) {
    throw new BadRequestError("Selected approver is not mapped to an active approval level");
  }

  const service = await officialRepo.getServiceById(booking.OFFSERVID);
  if (service?.REQAPPRLVL === "L2" && approverTier !== "L2") {
    throw new BadRequestError("This service requires Level 2 approval. You must select a Level 2 approver.");
  }

  // Cutoff validation
  const eventDateTimeIST = toMySQLDateTime(newEventTimeStr);
  const eventTime = dayjs.tz(eventDateTimeIST, TIMEZONE_IST).valueOf();
  const leadTimeHours = (eventTime - getNowIST().valueOf()) / (1000 * 60 * 60);
  if (leadTimeHours < (service?.CUTOFFHOURS || 24)) {
    throw new BadRequestError(
      `Booking cutoff violation: ${service?.SERVNAME || "This service"} requires at least ${service?.CUTOFFHOURS || 24} hours notice prior to event.`
    );
  }

  await officialRepo.resubmitOfficialBooking({
    bookingId,
    newComboId,
    purpose: updatedData.PURPOSE || booking.PURPOSE,
    venue: updatedData.VENUE || booking.VENUE,
    eventDateTimeIST,
    quantity: newQty,
    noOfPeople: updatedData.NOOFPEOPLE || booking.NOOFPEOPLE,
    approverId: newApproverId,
    userId: user.USERID,
  });

  logger.info({ bookingId, userId: user.USERID }, "Official booking resubmitted");

  return await getOfficialBookingById(bookingId);
};

// ============================================================
// 7. KITCHEN PREPARATION & CONFIRMED ORDERS FULFILLMENT
// ============================================================

export const listConfirmedOfficialBookings = async (canteenId, { date, fromDate, toDate } = {}) => {
  return await officialRepo.listConfirmedOfficialBookings(canteenId, { date, fromDate, toDate });
};

export const getOfficialKitchenPrepSummary = async (canteenId, targetDate) => {
  return await officialRepo.getOfficialKitchenPrepSummary(canteenId, targetDate);
};

export const updateBookingFulfillmentService = async (bookingId, status, user) => {
  const booking = await officialRepo.getBookingHeaderById(bookingId);
  if (!booking) {
    throw new NotFoundError("Official Booking not found");
  }

  // Ensure user has role for this canteen if not admin
  const isSysAdmin = (user?.SYSTEMROLES || []).includes("SYSADM");
  if (!isSysAdmin) {
    const userCanteenIds = (user?.CANTEENROLES || [])
      .filter((r) => ["CNTMGR", "CNTAST", "CNTSTF"].includes(r.ROLECODE || r.ROLENAME))
      .map((r) => r.CANTEENID);
    if (!userCanteenIds.includes(booking.CANTEENID)) {
      throw new ForbiddenError("You are not authorized to update fulfillment for this canteen");
    }
  }

  return await officialRepo.updateBookingFulfillment(bookingId, status, user.USERID);
};

export const updateDishPrepStatusService = async ({ CANTEENID, DATE, MENUITEMID, STATUS }, user) => {
  // Ensure user has role for this canteen if not admin
  const isSysAdmin = (user?.SYSTEMROLES || []).includes("SYSADM");
  if (!isSysAdmin) {
    const userCanteenIds = (user?.CANTEENROLES || [])
      .filter((r) => ["CNTMGR", "CNTAST", "CNTSTF"].includes(r.ROLECODE || r.ROLENAME))
      .map((r) => r.CANTEENID);
    if (!userCanteenIds.includes(Number(CANTEENID))) {
      throw new ForbiddenError("You are not authorized to update dish prep status for this canteen");
    }
  }

  return await officialRepo.updateDishPrepStatus(CANTEENID, DATE, MENUITEMID, STATUS, user.USERID);
};

// ============================================================
// 8. CANTEEN & ENTITY RESOLUTION HELPERS (FOR RBAC & VALIDATION)
// ============================================================

export const getCanteenIdByServiceId = async (serviceId) => {
  return await officialRepo.getCanteenIdByServiceId(serviceId);
};

export const getCanteenIdByComboId = async (comboId) => {
  return await officialRepo.getCanteenIdByComboId(comboId);
};

export const getCanteenIdByBookingId = async (bookingId) => {
  return await officialRepo.getCanteenIdByBookingId(bookingId);
};

export const getServiceById = async (serviceId) => {
  return await officialRepo.getServiceById(serviceId);
};

export const getComboById = async (comboId) => {
  return await officialRepo.getComboById(comboId);
};

export const getBookingHeaderById = async (bookingId) => {
  return await officialRepo.getBookingHeaderById(bookingId);
};
