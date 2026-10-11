import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import * as BookingController from "./booking.controller.js";
import * as validation from "./booking.validation.js";

const router = Router();

// Create next-day pre-booking
router.post(
  "/self-service/book",
  validate(validation.bookNextDaySchema),
  BookingController.bookNextDayController
);

// Cancel pre-booking
router.post(
  "/self-service/cancel",
  validate(validation.cancelBookingSchema),
  BookingController.cancelBookingController
);

export default router;
