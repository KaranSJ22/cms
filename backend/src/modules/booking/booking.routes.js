import express from "express";
import { validate } from "../../middlwares/validate.middleware.js";
import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeRoles, authorizeAnyCanteenRole } from "../../middlwares/role.middleware.js";
import {
  getBookingController,
  getBookingsController,
  createBookingController,
  updateBookingItemController,
  cancelBookingController,
  serveBookingController,
  noShowBookingController,
  toggleKioskController,
} from "./booking.controller.js";
import {
  createBookingSchema,
  updateBookingItemSchema,
  cancelBookingSchema,
  serveBookingSchema,
  noShowBookingSchema,
  toggleKioskSchema,
} from "./booking.validation.js";

const router = express.Router();

// Fetch booking endpoints
router.get("/", authenticate, getBookingsController);
router.get("/:id", authenticate, getBookingController);

// Create a booking
router.post(
  "/",
  authenticate,
  validate(createBookingSchema),
  createBookingController
);

// Update a booking item
router.put(
  "/:id/items/:itemId",
  authenticate,
  validate(updateBookingItemSchema),
  updateBookingItemController
);

// Cancel a booking
router.patch(
  "/:id/cancel",
  authenticate,
  validate(cancelBookingSchema),
  cancelBookingController
);

// Serve a booking (e.g. by Canteen Staff scanning QR/RFID)
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
  authorizeRoles("ADMIN", "CTNMNG", "CTNSTF"),
  validate(toggleKioskSchema),
  toggleKioskController
);

export default router;
