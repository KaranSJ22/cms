import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import * as KioskController from "./kiosk.controller.js";
import * as validation from "./kiosk.validation.js";

const router = Router();

// Employee Self-Service Verification (by RFID scan or ID)
router.post(
  "/self-service/scan",
  validate(validation.scanSelfServiceSchema),
  KioskController.scanSelfServiceController
);

// Tomorrow's available services
router.get(
  "/self-service/services",
  validate(validation.nextDayServicesSchema),
  KioskController.getNextDayServicesController
);

// Tomorrow's kiosk-enabled menu
router.get(
  "/self-service/menu",
  validate(validation.nextDayMenuSchema),
  KioskController.getNextDayMenuController
);

export default router;
