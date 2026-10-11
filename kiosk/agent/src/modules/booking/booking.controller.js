import * as BookingService from "./booking.service.js";
import { sendSuccess } from "../../common/responses/apiResponse.js";

export const bookNextDayController = async (req, res, next) => {
  try {
    const payload = req.validated?.body || req.body;
    const result = BookingService.bookNextDay(payload);
    return sendSuccess(res, result, "Pre-booking created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const cancelBookingController = async (req, res, next) => {
  try {
    const payload = req.validated?.body || req.body;
    const result = BookingService.cancelBooking(payload);
    return sendSuccess(res, result, "Booking cancelled successfully");
  } catch (error) {
    next(error);
  }
};
