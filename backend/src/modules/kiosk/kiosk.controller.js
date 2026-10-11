import { sendSuccess } from "../../utils/apiResponse.js";
import { getClientIp } from "../../middlewares/kioskDevice.middleware.js";
import * as KioskService from "./kiosk.service.js";

/**
 * Handshake endpoint: returns terminal config based on client IP
 */
export const getKioskConfigController = async (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    const result = await KioskService.getKioskConfig(clientIp);
    return sendSuccess(res, result, "Kiosk configuration resolved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * RFID / ID scan at Employee Self-Service Kiosk
 */
export const scanSelfServiceController = async (req, res, next) => {
  try {
    const payload = req.validated?.body || req.body;
    const result = await KioskService.scanSelfService(payload);
    return sendSuccess(res, result, "Employee verified successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Tomorrow's available meal services (Breakfast, Lunch, etc.)
 */
export const getNextDayServicesController = async (req, res, next) => {
  try {
    const effectiveCanteenId =
      req.query.canteenId || req.kiosk?.canteenId || 1;
    const result = await KioskService.getNextDayServices(effectiveCanteenId);
    return sendSuccess(res, result, "Available meal services retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Tomorrow's kiosk-enabled menu (optionally filtered by serviceId)
 */
export const getNextDayMenuController = async (req, res, next) => {
  try {
    const effectiveCanteenId =
      req.query.canteenId || req.kiosk?.canteenId || 1;
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : null;
    const result = await KioskService.getNextDayMenu(effectiveCanteenId, serviceId);
    return sendSuccess(res, result, "Next day menu retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Create next-day pre-booking from self-service kiosk
 */
export const bookNextDayController = async (req, res, next) => {
  try {
    const payload = req.validated?.body || req.body;
    const result = await KioskService.bookNextDay(payload, req.kiosk);
    return sendSuccess(res, result, "Meal booked successfully for tomorrow", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking details and items for editing at kiosk
 */
export const getKioskBookingDetailsController = async (req, res, next) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const customerId = req.query.customerId ? Number(req.query.customerId) : null;
    const result = await KioskService.getKioskBookingDetails(bookingId, customerId);
    return sendSuccess(res, result, "Booking details retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Update active booking from self-service kiosk before cutoff
 */
export const updateKioskBookingController = async (req, res, next) => {
  try {
    const payload = req.validated?.body || req.body;
    const result = await KioskService.updateKioskBooking(payload, req.kiosk);
    return sendSuccess(res, result, "Booking updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel active booking from self-service kiosk
 */
export const cancelKioskBookingController = async (req, res, next) => {
  try {
    const payload = req.validated?.body || req.body;
    const result = await KioskService.cancelKioskBooking(payload, req.kiosk);
    return sendSuccess(res, result, "Booking cancelled successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Kiosk hardware heartbeat
 */
export const heartbeatController = async (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    const { KIOSKID } = req.validated?.body || req.body;
    const result = await KioskService.recordHeartbeat(KIOSKID, clientIp);
    return sendSuccess(res, result, "Heartbeat recorded successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Currently active or upcoming meal slot for serving terminal
 */
export const getCurrentSlotController = async (req, res, next) => {
  try {
    const canteenId = req.query.canteenId || req.kiosk?.canteenId || req.user?.CANTEENROLES?.[0]?.CANTEENID || 1;
    const kioskId = req.query.kioskId || req.kiosk?.kioskId || null;
    const result = await KioskService.getCurrentSlot(canteenId, kioskId);
    return sendSuccess(res, result, "Current slot retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Resolves active booking for serving counter with meal slot and time-window awareness
 */
export const resolveServingBookingController = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const canteenId = req.query.canteenId || req.kiosk?.canteenId || req.user?.CANTEENROLES?.[0]?.CANTEENID || null;
    const kioskId = req.query.kioskId || req.kiosk?.kioskId || null;
    const daySlotId = req.query.daySlotId || null;

    const result = await KioskService.resolveServingBooking(identifier, canteenId, kioskId, daySlotId);
    return sendSuccess(res, result, "Booking resolved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Marks booking as served from the kiosk terminal
 */
export const serveBookingController = async (req, res, next) => {
  try {
    const { bookingId, kioskId } = req.body;
    const userId = req.user?.USERID || 1;
    const effectiveKioskId = kioskId || req.kiosk?.kioskId || null;

    const result = await KioskService.serveBooking(bookingId, userId, effectiveKioskId);
    return sendSuccess(res, result, "Booking marked as served successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Returns all active canteens for terminal selection
 */
export const getActiveCanteensController = async (req, res, next) => {
  try {
    const canteens = await KioskService.getActiveCanteens();
    return sendSuccess(res, canteens, "Active canteens retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Returns all meal slots scheduled for today at a canteen
 */
export const getTodaySlotsController = async (req, res, next) => {
  try {
    const canteenId = req.query.canteenId || req.kiosk?.canteenId || 1;
    const slots = await KioskService.getTodaySlots(canteenId);
    return sendSuccess(res, slots, "Today's meal slots retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Master data bootstrap package snapshot for offline kiosk terminals
 */
export const bootstrapPackageController = async (req, res, next) => {
  try {
    const effectiveCanteenId = req.query.canteenId || req.kiosk?.canteenId || 1;
    const since = req.query.since || req.headers["if-modified-since"] || null;
    const result = await KioskService.getBootstrapPackage(effectiveCanteenId, since);
    if (result.notModified) {
      return res.status(304).end();
    }
    if (result.lastModified) {
      res.setHeader("X-Last-Modified", result.lastModified);
    }
    return sendSuccess(res, result, "Bootstrap package retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Ingest offline outbox batch from kiosk terminal
 */
export const syncOfflineController = async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await KioskService.syncOfflineBatch(payload, req.kiosk);
    return sendSuccess(res, result, "Offline sync batch processed successfully");
  } catch (error) {
    next(error);
  }
};


