import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as officialService from "./official.service.js";

// ============================================================
// Services & Combos
// ============================================================

export const listServicesController = asyncHandler(async (req, res) => {
  const canteenId = Number(req.query.canteenId);
  const statusId = req.query.statusId ? Number(req.query.statusId) : null;
  const services = await officialService.listServicesByCanteen(canteenId, statusId);
  return sendSuccess(res, services, "Official services retrieved successfully");
});

export const getServiceDetailsController = asyncHandler(async (req, res) => {
  const service = await officialService.getServiceDetails(req.params.id);
  return sendSuccess(res, service, "Official service details retrieved");
});

export const createServiceController = asyncHandler(async (req, res) => {
  const result = await officialService.createService(req.validated.body, req.user.USERID);
  return sendSuccess(res, result, "Official service created successfully", 201);
});

export const updateServiceController = asyncHandler(async (req, res) => {
  const result = await officialService.updateService(req.params.id, req.validated.body, req.user.USERID);
  return sendSuccess(res, result, "Official service updated successfully");
});

export const createComboController = asyncHandler(async (req, res) => {
  const comboId = await officialService.createCombo(req.validated.body, req.user.USERID);
  return sendSuccess(res, { OFFCOMBOID: comboId }, "Official combo created successfully", 201);
});

export const updateComboController = asyncHandler(async (req, res) => {
  await officialService.updateCombo(req.params.id, req.validated.body, req.user.USERID);
  return sendSuccess(res, null, "Official combo updated successfully");
});

export const listAvailableMenuItemsController = asyncHandler(async (req, res) => {
  const canteenId = req.query.canteenId ? Number(req.query.canteenId) : null;
  const items = await officialService.listAvailableMenuItems(canteenId);
  return sendSuccess(res, items, "Menu items for official services retrieved");
});

// ============================================================
// Level Mappings & Approvers
// ============================================================

export const listLevelMappingsController = asyncHandler(async (req, res) => {
  const mappings = await officialService.listLevelMappings();
  return sendSuccess(res, mappings, "Employee level mappings retrieved");
});

export const upsertLevelMappingController = asyncHandler(async (req, res) => {
  const result = await officialService.upsertLevelMapping(req.validated.body, req.user.USERID);
  return sendSuccess(res, result, "Employee level mapping saved successfully");
});

export const getEligibleApproversController = asyncHandler(async (req, res) => {
  const level = req.query.level; // 'L1' or 'L2'
  const approvers = await officialService.getEligibleApprovers(level, req.user.USERID);
  return sendSuccess(res, approvers, "Eligible approvers retrieved");
});

// ============================================================
// Booking Lifecycle
// ============================================================

export const createBookingController = asyncHandler(async (req, res) => {
  const result = await officialService.createOfficialBooking(req.validated.body, req.user);
  return sendSuccess(res, result, "Official booking submitted successfully", 201);
});

export const getBookingDetailsController = asyncHandler(async (req, res) => {
  const booking = await officialService.getOfficialBookingById(req.params.id);
  return sendSuccess(res, booking, "Official booking details retrieved");
});

export const listMyBookingsController = asyncHandler(async (req, res) => {
  const bookings = await officialService.listMyOfficialBookings(req.user.CUSTOMERID);
  return sendSuccess(res, bookings, "My official bookings retrieved");
});

export const resubmitBookingController = asyncHandler(async (req, res) => {
  const updated = await officialService.resubmitOfficialBooking(req.params.id, req.validated.body, req.user);
  return sendSuccess(res, updated, "Official booking resubmitted successfully");
});

// ============================================================
// Approver Workflow
// ============================================================

export const listAssignedApprovalsController = asyncHandler(async (req, res) => {
  const requests = await officialService.listAssignedApprovals(req.user.USERID);
  return sendSuccess(res, requests, "Assigned official requests retrieved");
});

export const processApproverActionController = asyncHandler(async (req, res) => {
  const { ACTION, REJREASON } = req.validated.body;
  const result = await officialService.processApproverAction({
    bookingId: req.params.id,
    action: ACTION,
    rejReason: REJREASON,
    approverUserId: req.user.USERID,
  });
  return sendSuccess(res, result, `Booking ${ACTION.toLowerCase()}d successfully`);
});

// ============================================================
// Canteen Manager Workflow
// ============================================================

export const listManagerPendingBookingsController = asyncHandler(async (req, res) => {
  const canteenId = Number(req.query.canteenId);
  const requests = await officialService.listManagerPendingBookings(canteenId);
  return sendSuccess(res, requests, "Pending manager official bookings retrieved");
});

export const processManagerActionController = asyncHandler(async (req, res) => {
  const { ACTION, REJREASON } = req.validated.body;
  const result = await officialService.processManagerAction({
    bookingId: req.params.id,
    action: ACTION,
    rejReason: REJREASON,
    managerUserId: req.user.USERID,
    canteenRoles: req.user.CANTEENROLES,
  });
  return sendSuccess(res, result, `Booking ${ACTION.toLowerCase()}ed successfully`);
});

// ============================================================
// Kitchen Preparation & Fulfillment Workflow (Staff & Manager)
// ============================================================

export const listConfirmedOfficialBookingsController = asyncHandler(async (req, res) => {
  const canteenId = Number(req.validated.query.canteenId);
  const { date, fromDate, toDate } = req.validated.query;
  const bookings = await officialService.listConfirmedOfficialBookings(canteenId, {
    date,
    fromDate,
    toDate,
  });
  return sendSuccess(res, bookings, "Confirmed official bookings retrieved");
});

export const getOfficialKitchenPrepSummaryController = asyncHandler(async (req, res) => {
  const canteenId = Number(req.validated.query.canteenId);
  const { date } = req.validated.query;
  const summary = await officialService.getOfficialKitchenPrepSummary(canteenId, date);
  return sendSuccess(res, summary, "Official kitchen prep summary retrieved");
});
