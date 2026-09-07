import { Router } from "express";
import { validate } from "../../middlwares/validate.middleware.js";
import { detectKiosk, requireKiosk } from "../../middlwares/kioskDevice.middleware.js";
import * as KioskController from "./kiosk.controller.js";
import * as validation from "./kiosk.validation.js";

const router = Router();

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
// 3. Staff Counter Terminal Operations
// ------------------------------------------------------------
// Get active or upcoming meal slot for serving counter
router.get(
  "/current-slot",
  detectKiosk,
  KioskController.getCurrentSlotController
);

// Dedicated slot-aware booking resolution
router.get(
  "/resolve/:identifier",
  detectKiosk,
  KioskController.resolveServingBookingController
);

// Mark booking served at kiosk
router.post(
  "/serve",
  detectKiosk,
  KioskController.serveBookingController
);

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

export default router;
