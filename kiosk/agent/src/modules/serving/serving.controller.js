import * as ServingService from "./serving.service.js";
import { sendSuccess } from "../../common/responses/apiResponse.js";

export const staffLoginController = async (req, res, next) => {
  try {
    const { LOGINID, PASSWORD, loginId, password, rfidUid, PRFIDHASH } = req.body;
    const result = await ServingService.staffLogin(
      LOGINID || loginId,
      PASSWORD || password,
      rfidUid || PRFIDHASH
    );
    return sendSuccess(res, result, "Staff login successful");
  } catch (err) {
    next(err);
  }
};

export const resolveServingController = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const { canteenId, kioskId, daySlotId } = req.query;
    const result = await ServingService.resolveServingBooking(identifier, canteenId, kioskId, daySlotId);
    return sendSuccess(res, result, "Serving booking resolved successfully");
  } catch (err) {
    next(err);
  }
};

const parseStaffUserId = (req) => {
  if (req.user?.USERID || req.user?.userId) {
    return req.user.USERID || req.user.userId;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7).trim();
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        return payload.USERID || payload.userId || payload.sub || null;
      }
    } catch {
      // Ignore malformed token
    }
  }
  return null;
};

export const serveBookingController = async (req, res, next) => {
  try {
    const { bookingId, kioskId } = req.body;
    const staffToken = req.headers.authorization;
    const staffUserId = parseStaffUserId(req);
    const result = await ServingService.serveBooking(bookingId, kioskId, staffToken, staffUserId);
    return sendSuccess(res, result, "Booking marked as served successfully");
  } catch (err) {
    next(err);
  }
};

export const cancelCounterBookingController = async (req, res, next) => {
  try {
    const { bookingId, cancelReason } = req.body;
    const staffToken = req.headers.authorization;
    const staffUserId = parseStaffUserId(req);
    const result = await ServingService.cancelCounterBooking(bookingId, cancelReason, staffToken, staffUserId);
    return sendSuccess(res, result, result.message || "Booking cancelled and refunded successfully");
  } catch (err) {
    next(err);
  }
};

export const lookupWalkinCustomerController = async (req, res, next) => {
  try {
    const { query } = req.query;
    const staffToken = req.headers.authorization;
    const result = await ServingService.lookupWalkinCustomer(query, staffToken);
    return sendSuccess(res, result, "Customer profile resolved successfully");
  } catch (err) {
    next(err);
  }
};

export const getWalkinMenuController = async (req, res, next) => {
  try {
    const { canteenId, ctypeCode } = req.query;
    const staffToken = req.headers.authorization;
    const result = await ServingService.getWalkinMenu(canteenId, ctypeCode || "PRM", staffToken);
    return sendSuccess(res, result, "Active slot menu retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const serveWalkinController = async (req, res, next) => {
  try {
    const staffToken = req.headers.authorization;
    const staffUserId = parseStaffUserId(req);
    const result = await ServingService.serveWalkinOrder(req.body, staffToken, staffUserId);
    return sendSuccess(res, result, "On-spot food served successfully");
  } catch (err) {
    next(err);
  }
};

export const getActiveCanteensController = async (req, res, next) => {
  try {
    const result = await ServingService.getActiveCanteens();
    return sendSuccess(res, result, "Active canteens retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getTodaySlotsController = async (req, res, next) => {
  try {
    const { canteenId } = req.query;
    const result = await ServingService.getTodaySlots(canteenId);
    return sendSuccess(res, result, "Today slots retrieved successfully");
  } catch (err) {
    next(err);
  }
};

