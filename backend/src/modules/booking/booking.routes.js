import express from "express";
import { validate } from "../../middlwares/validate.middleware.js";
import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeRoles, authorizeAnyCanteenRole } from "../../middlwares/role.middleware.js";
import {
  getBookingController,
  getBookingsController,
  getKitchenPrepController,
  createBookingController,
  updateBookingItemController,
  cancelBookingController,
  serveBookingController,
  noShowBookingController,
  toggleKioskController,
  scanRfidController,
  serveBookingItemController,
  resolveBookingController,
} from "./booking.controller.js";
import {
  createBookingSchema,
  updateBookingItemSchema,
  cancelBookingSchema,
  serveBookingSchema,
  noShowBookingSchema,
  toggleKioskSchema,
  scanRfidSchema,
  getKitchenPrepSchema,
} from "./booking.validation.js";

const router = express.Router();

// Fetch booking endpoints
router.get("/", authenticate, getBookingsController);
router.get(
  "/kitchen-prep",
  authenticate,
  authorizeAnyCanteenRole("CTNMNG", "CTNSTF", "CTNAST"),
  validate(getKitchenPrepSchema),
  getKitchenPrepController
);
router.get("/:id", authenticate, getBookingController);

// Create a booking
router.post(
  "/",
  authenticate,
  validate(createBookingSchema),
  createBookingController
);

// Scan RFID at Kiosk
router.post(
  "/scan-rfid",
  authenticate,
  authorizeAnyCanteenRole("CTNMNG", "CTNSTF"),
  validate(scanRfidSchema),
  scanRfidController
);

// Update a booking item
router.put(
  "/:id/items/:itemId",
  authenticate,
  validate(updateBookingItemSchema),
  updateBookingItemController
);

// Serve a specific booking item
router.patch(
  "/:id/items/:itemId/serve",
  authenticate,
  authorizeAnyCanteenRole("CTNMNG", "CTNSTF"),
  validate(serveBookingSchema), // Reuse serveBookingSchema since it just expects an optional PSERVEREASON
  serveBookingItemController
);

// Cancel a booking
router.patch(
  "/:id/cancel",
  authenticate,
  validate(cancelBookingSchema),
  cancelBookingController
);

// Serve an entire booking
router.patch(
  "/:id/serve",
  authenticate,
  authorizeAnyCanteenRole("CTNMNG", "CTNSTF"),
  validate(serveBookingSchema),
  serveBookingController
);

// Mark booking as no-show
router.patch(
  "/:id/no-show",
  authenticate,
  authorizeAnyCanteenRole("CTNMNG", "CTNSTF"),
  validate(noShowBookingSchema),
  noShowBookingController
);

// Toggle Kiosk availability on a Day Menu
router.patch(
  "/kiosk-toggle/:dayMenuId",
  authenticate,
  authorizeRoles("CTNMNG", "CTNSTF"),
  validate(toggleKioskSchema),
  toggleKioskController
);

export default router;
