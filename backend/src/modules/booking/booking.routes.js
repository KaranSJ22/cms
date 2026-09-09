import express from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";
import {
  getActiveBookingController,
  getBookingController,
  getBookingsController,
  getKitchenPrepController,
  createBookingController,
  addBookingItemController,
  updateBookingItemController,
  cancelBookingItemController,
  cancelBookingController,
  serveBookingController,
  noShowBookingController,
  toggleKioskController,
  scanRfidController,
  serveBookingItemController,
  resolveBookingController,
  createWeeklyBookingBatchController,
  getWeeklyPublishedMenuController,
} from "./booking.controller.js";
import {
  getActiveBookingSchema,
  createBookingSchema,
  addBookingItemSchema,
  updateBookingItemSchema,
  cancelBookingItemSchema,
  cancelBookingSchema,
  serveBookingSchema,
  serveBookingItemSchema,
  noShowBookingSchema,
  toggleKioskSchema,
  scanRfidSchema,
  getKitchenPrepSchema,
  createWeeklyBookingBatchSchema,
  getWeeklyPublishedMenuSchema,
} from "./booking.validation.js";

const router = express.Router();

// Fetch weekly published menu (with base items, holidays & existing bookings)
router.get(
  "/weekly-menu",
  authenticate,
  validate(getWeeklyPublishedMenuSchema),
  getWeeklyPublishedMenuController
);

// Create weekly / 5-day booking batch
router.post(
  "/weekly-batch",
  authenticate,
  validate(createWeeklyBookingBatchSchema),
  createWeeklyBookingBatchController
);

// Fetch active booking for context
router.get(
  "/active",
  authenticate,
  validate(getActiveBookingSchema),
  getActiveBookingController
);

// Fetch booking endpoints
router.get("/", authenticate, getBookingsController);

router.get(
  "/kitchen-prep",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTSTF", "CNTAST"),
  validate(getKitchenPrepSchema),
  getKitchenPrepController
);

// Resolve booking for serving counter lookup
router.get(
  "/resolve/:identifier",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTSTF"),
  resolveBookingController
);

router.get("/:id", authenticate, getBookingController);

// Create a booking
router.post(
  "/",
  authenticate,
  validate(createBookingSchema),
  createBookingController
);

// Add an item to an existing booking (incremental)
router.post(
  "/:id/items",
  authenticate,
  validate(addBookingItemSchema),
  addBookingItemController
);

// Update a booking item quantity (incremental)
router.put(
  "/:id/items/:itemId",
  authenticate,
  validate(updateBookingItemSchema),
  updateBookingItemController
);

// Cancel an individual booking item (incremental soft-cancel)
router.patch(
  "/:id/items/:itemId/cancel",
  authenticate,
  validate(cancelBookingItemSchema),
  cancelBookingItemController
);

// Scan RFID at Kiosk
router.post(
  "/scan-rfid",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTSTF"),
  validate(scanRfidSchema),
  scanRfidController
);

// Serve a specific booking item
router.patch(
  "/:id/items/:itemId/serve",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTSTF"),
  validate(serveBookingItemSchema),
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
  authorizeAnyCanteenRole("CNTMGR", "CNTSTF"),
  validate(serveBookingSchema),
  serveBookingController
);

// Mark booking as no-show
router.patch(
  "/:id/no-show",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTSTF"),
  validate(noShowBookingSchema),
  noShowBookingController
);

// Toggle Kiosk availability on a Day Menu
router.patch(
  "/kiosk-toggle/:dayMenuId",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTSTF"),
  validate(toggleKioskSchema),
  toggleKioskController
);

export default router;
