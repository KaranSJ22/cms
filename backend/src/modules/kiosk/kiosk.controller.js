import { sendSuccess } from "../../utils/apiResponse.js";
import { getClientIp } from "../../middlewares/kioskDevice.middleware.js";
import { ForbiddenError, BadRequestError, NotFoundError, UnauthorizedError } from "../../common/errors/appError.js";
import * as authService from "../auth/auth.service.js";
import { WalkinService } from "../walkin/walkin.service.js";
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
 * Cancels active booking at serving counter by staff with attribution and automatic refund
 */
export const cancelCounterBookingController = async (req, res, next) => {
  try {
    const { bookingId, cancelReason } = req.body;
    const userId = req.user?.USERID || 1;
    const reason = cancelReason || `Cancelled at Serving Counter by Staff [User #${userId}]`;
    const result = await KioskService.cancelCounterBooking(bookingId, userId, reason);
    return sendSuccess(res, result, "Booking cancelled and refunded successfully");
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

/**
 * Ingest offline serving events batch from kiosk terminal
 */
export const syncServingEventsController = async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await KioskService.syncServingEventsBatch(payload, req.kiosk);
    return sendSuccess(res, result, "Offline serving events sync batch processed successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Staff Shift Login for Serving Counter (Supports RFID badge tap or LoginID/Password)
 */
export const counterLoginController = async (req, res, next) => {
  try {
    const { loginId, password, rfidUid } = req.body;
    const cleanId = (loginId || "").trim();
    const cleanRfid = (rfidUid || "").trim();

    let authResult;
    if (cleanRfid && !password) {
      // 1. Centralized RFID Tap Login via authService
      authResult = await authService.rfidLoginUser({ rfidUid: cleanRfid });
    } else if (cleanId && password) {
      // 2. Centralized Username & Password Login via authService
      authResult = await authService.loginUser({ LOGINID: cleanId, PASSWORD: password });
    } else {
      throw new BadRequestError("Staff Login ID with password or RFID badge tap is required");
    }

    const ALLOWED_STAFF_ROLES = ["CNTSTF", "CNTMGR", "CTNMNG", "CNTAST", "CTNAST", "SYSADM"];
    const systemRoles = authResult.USER?.SYSTEMROLES || [];
    const canteenRoles = authResult.USER?.CANTEENROLES || [];
    const isSystemAdmin = systemRoles.includes("SYSADM");
    const hasCanteenRole = canteenRoles.some((cr) => ALLOWED_STAFF_ROLES.includes(cr.ROLECODE));

    if (!isSystemAdmin && !hasCanteenRole) {
      throw new ForbiddenError(
        "Access denied. You do not have an active Canteen Staff, Manager, or Assistant assignment."
      );
    }

    return sendSuccess(
      res,
      {
        token: authResult.TOKEN,
        user: {
          userId: authResult.USER.USERID,
          loginId: authResult.USER.LOGINID,
          fullName: authResult.USER.FULLNAME,
          email: authResult.USER.EMAIL,
          canteenRoles: canteenRoles.map((cr) => ({
            canteenId: cr.CANTEENID,
            canteenName: cr.CANTEENNAME,
            canteenCode: cr.CANTEENCODE,
            roleCode: cr.ROLECODE,
            roleName: cr.ROLENAME,
            isDefault: Boolean(cr.ISDEFAULT),
          })),
        },
      },
      "Staff shift login successful"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Customer lookup for on-spot walk-in food
 */
export const counterWalkinCustomerController = async (req, res, next) => {
  try {
    const query = req.query.query || req.query.identifier || "";
    if (!query) {
      throw new BadRequestError("Query parameter is required");
    }

    let customer = await WalkinService.employeeLookup(query);
    if (!customer) {
      const visitors = await WalkinService.visitorLookup(query);
      if (visitors && visitors.length > 0) {
        customer = visitors[0];
      }
    }

    if (!customer) {
      throw new NotFoundError(`Customer "${query}" not found`);
    }

    return sendSuccess(
      res,
      {
        customerId: customer.CUSTOMERID,
        dispName: customer.DISPNAME || customer.VISNAME || "Customer",
        loginId: customer.LOGINID || customer.EMPCODE || customer.CONTCODE || query,
        ctypeCode: customer.CTYPECODE || "PRM",
        ctypeName: customer.CTYPENAME || "Employee",
        walletId: customer.WALLETID || null,
        walletBalance: Number(customer.WALLETBALANCE || 0),
        isLiveOnline: true,
      },
      "Walk-in customer resolved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get surplus walk-in menu for today's active slot
 */
export const counterWalkinMenuController = async (req, res, next) => {
  try {
    const canteenId = Number(req.query.canteenId) || 1;
    const ctypeCode = req.query.ctypeCode || "PRM";

    const items = await WalkinService.getActiveMenu(canteenId, ctypeCode);
    const mapped = (items || []).map((it) => ({
      dayMenuId: it.DAYMENUID,
      daySlotId: it.DAYSLOTID,
      serviceId: it.SERVICEID,
      serviceName: it.SERVNAME || "Meal",
      menuItemId: it.MENUITEMID,
      itemName: it.ITEMNAME,
      shortName: it.SHORTNAME,
      price: Number(it.PRICE || 0),
      isBase: Boolean(it.ISBASE),
      isSpecial: Boolean(it.ISSPECIAL),
    }));

    return sendSuccess(res, mapped, "Walk-in menu retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Direct atomic walk-in food dispensing
 */
export const counterWalkinServeController = async (req, res, next) => {
  try {
    const { customerId, canteenId, serviceId, items } = req.body;
    const staffUserId = req.user?.USERID || 1;

    const result = await WalkinService.serveWalkin(
      {
        customerId: Number(customerId),
        canteenId: Number(canteenId || 1),
        serviceId: Number(serviceId),
        items: (items || []).map((i) => ({
          dayMenuId: Number(i.dayMenuId),
          qty: Number(i.qty || 1),
        })),
      },
      staffUserId
    );

    return sendSuccess(res, result, "Walk-in meal dispensed and served successfully");
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Hardware Kiosk Fleet Management (SYSADM)
// ============================================================

export const listKioskDevicesController = async (req, res, next) => {
  try {
    const canteenId = req.query.canteenId ? Number(req.query.canteenId) : null;
    const devices = await KioskService.listKioskDevices(canteenId);
    return sendSuccess(res, devices, "Kiosk devices retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const registerKioskDeviceController = async (req, res, next) => {
  try {
    const result = await KioskService.registerKioskDevice(req.body, req.user.USERID);
    return sendSuccess(res, result, "Kiosk device registered successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const getKioskDeviceDetailsController = async (req, res, next) => {
  try {
    const kioskId = Number(req.params.id);
    const device = await KioskService.getKioskDeviceDetails(kioskId);
    return sendSuccess(res, device, "Kiosk device details retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const updateKioskDeviceStatusController = async (req, res, next) => {
  try {
    const kioskId = Number(req.params.id);
    const { STATUSID } = req.body;
    const device = await KioskService.updateKioskDeviceStatus(kioskId, STATUSID, req.user.USERID);
    return sendSuccess(res, device, "Kiosk device status updated successfully");
  } catch (error) {
    next(error);
  }
};

export const getKioskFleetTelemetryController = async (req, res, next) => {
  try {
    const telemetry = await KioskService.getKioskFleetTelemetry();
    return sendSuccess(res, telemetry, "Kiosk fleet telemetry retrieved successfully");
  } catch (error) {
    next(error);
  }
};




