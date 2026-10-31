import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { detectKiosk, requireKiosk } from "../../middlewares/kioskDevice.middleware.js";
import { authenticate, optionalAuthenticate } from "../../middlewares/auth.middleware.js";
import { authorizeSystemRoles } from "../../middlewares/role.middleware.js";
import * as KioskController from "./kiosk.controller.js";
import * as validation from "./kiosk.validation.js";

const router = Router();

// ------------------------------------------------------------
// 0. Hardware Kiosk Fleet Management (SYSADM only)
// ------------------------------------------------------------
router.get(
  "/devices",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(validation.listKioskDevicesSchema),
  KioskController.listKioskDevicesController
);

router.post(
  "/devices",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(validation.registerKioskDeviceSchema),
  KioskController.registerKioskDeviceController
);

router.get(
  "/devices/telemetry",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  KioskController.getKioskFleetTelemetryController
);

router.get(
  "/devices/:id",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(validation.kioskIdParamSchema),
  KioskController.getKioskDeviceDetailsController
);

router.put(
  "/devices/:id/status",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(validation.updateKioskStatusSchema),
  KioskController.updateKioskDeviceStatusController
);

// ------------------------------------------------------------
// 1. Device Handshake & Telemetry
// ------------------------------------------------------------
// Handshake called on kiosk boot to identify terminal from IP
router.get("/config", detectKiosk, KioskController.getKioskConfigController);

// Heartbeat ping from Raspberry Pi background service
router.post(
  "/heartbeat",
  detectKiosk,
  validate(validation.kioskHeartbeatSchema),
  KioskController.heartbeatController
);

// ------------------------------------------------------------
// 2. Employee Self-Service Kiosk (Lobby Terminal)
// ------------------------------------------------------------
// RFID scan / tap at kiosk
router.post(
  "/self-service/scan",
  detectKiosk,
  validate(validation.scanSelfServiceSchema),
  KioskController.scanSelfServiceController
);

// Fetch tomorrow's available meal services
router.get(
  "/self-service/services",
  detectKiosk,
  validate(validation.kioskNextDayServicesSchema),
  KioskController.getNextDayServicesController
);

// Fetch tomorrow's published kiosk menu
router.get(
  "/self-service/menu",
  detectKiosk,
  validate(validation.kioskNextDayMenuSchema),
  KioskController.getNextDayMenuController
);

// Create next-day pre-booking
router.post(
  "/self-service/book",
  detectKiosk,
  validate(validation.kioskBookSchema),
  KioskController.bookNextDayController
);

// Get booking details and items for editing
router.get(
  "/self-service/booking/:bookingId",
  detectKiosk,
  KioskController.getKioskBookingDetailsController
);

// Update active booking from kiosk
router.post(
  "/self-service/update-booking",
  detectKiosk,
  validate(validation.kioskUpdateBookingSchema),
  KioskController.updateKioskBookingController
);

// Cancel active booking from kiosk
router.post(
  "/self-service/cancel",
  detectKiosk,
  validate(validation.kioskCancelSchema),
  KioskController.cancelKioskBookingController
);

// Backwards compatibility alias for scan
router.post(
  "/scan-self",
  detectKiosk,
  (req, res, next) => {
    // map PLOGINID -> PIDENTIFIER if necessary
    if (req.body?.PLOGINID && !req.body?.PIDENTIFIER) {
      req.body.PIDENTIFIER = req.body.PLOGINID;
    }
    next();
  },
  validate(validation.scanSelfServiceSchema),
  KioskController.scanSelfServiceController
);

// ------------------------------------------------------------
// 3. Staff Counter Terminal Operations (/counter/*)
// ------------------------------------------------------------
// Get active or upcoming meal slot for serving counter
router.get(
  "/counter/current-slot",
  detectKiosk,
  KioskController.getCurrentSlotController
);

// Dedicated slot-aware booking resolution
router.get(
  "/counter/resolve/:identifier",
  detectKiosk,
  KioskController.resolveServingBookingController
);

// Mark booking served at kiosk with staff operator attribution
router.post(
  "/counter/serve",
  detectKiosk,
  optionalAuthenticate,
  KioskController.serveBookingController
);

// Cancel booking at serving counter with staff attribution & wallet refund
router.post(
  "/counter/cancel",
  detectKiosk,
  optionalAuthenticate,
  KioskController.cancelCounterBookingController
);

// Staff Shift Login for Serving Counter
router.post(
  "/counter/login",
  KioskController.counterLoginController
);

// Counter facility & slot discovery aliases
router.get("/counter/canteens", detectKiosk, KioskController.getActiveCanteensController);
router.get("/counter/today-slots", detectKiosk, KioskController.getTodaySlotsController);

// Surplus Walk-in dispensing
router.get("/counter/walkin/customer", optionalAuthenticate, KioskController.counterWalkinCustomerController);
router.get("/counter/walkin/menu", optionalAuthenticate, KioskController.counterWalkinMenuController);
router.post("/counter/walkin/serve", optionalAuthenticate, KioskController.counterWalkinServeController);

// Diagnostics & Heartbeat
router.get("/system/health", (req, res) =>
  res.json({ SUCCESS: true, MESSAGE: "Central Backend Kiosk Subsystem Online" })
);

// Backwards-compatible aliases for legacy callers
router.get("/current-slot", detectKiosk, KioskController.getCurrentSlotController);
router.get("/resolve/:identifier", detectKiosk, KioskController.resolveServingBookingController);
router.post("/serve", detectKiosk, optionalAuthenticate, KioskController.serveBookingController);


// ------------------------------------------------------------
// 4. Canteen & Meal Slot Discovery
// ------------------------------------------------------------
// List all operational canteens for terminal selection
router.get(
  "/canteens",
  detectKiosk,
  KioskController.getActiveCanteensController
);

// List all scheduled meal slots for today at a canteen
router.get(
  "/today-slots",
  detectKiosk,
  KioskController.getTodaySlotsController
);

// ------------------------------------------------------------
// 5. Offline Edge Synchronization (Downlink & Uplink)
// ------------------------------------------------------------
// Master data bootstrap pull for offline kiosk local cache
router.get(
  "/bootstrap-package",
  detectKiosk,
  KioskController.bootstrapPackageController
);

// Ingest offline pre-bookings outbox batch
router.post(
  "/sync-offline",
  detectKiosk,
  KioskController.syncOfflineController
);

// Ingest offline counter serving events batch
router.post(
  "/sync-serving",
  detectKiosk,
  KioskController.syncServingEventsController
);

export default router;
