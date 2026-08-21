import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as bookingService from "./booking.service.js";

export const getBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.getBooking(req.params.id);
  return sendSuccess(res, data, "Booking fetched successfully");
});

export const getBookingsController = asyncHandler(async (req, res) => {
  const filters = {
    PCUSTOMERID: req.query.customerId,
    PSERVICEID: req.query.serviceId,
    PSTARTDATE: req.query.startDate,
    PENDDATE: req.query.endDate,
    PSTATUS: req.query.status
  };
  const data = await bookingService.listBookings(filters);
  return sendSuccess(res, data, "Bookings retrieved successfully");
});

export const getKitchenPrepController = asyncHandler(async (req, res) => {
  const data = await bookingService.fetchKitchenPrep(req.validated.query.daySlotId);
  return sendSuccess(res, data, "Kitchen prep data retrieved successfully");
});

export const createBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.validated.body, req.user.USERID);
  return sendSuccess(res, data, "Booking created successfully", 201);
});

export const updateBookingItemController = asyncHandler(async (req, res) => {
  const data = await bookingService.updateBookingItem(
    req.params.id,
    req.params.itemId,
    req.validated.body,
    req.user.USERID
  );
  return sendSuccess(res, data, "Booking item updated successfully");
});

export const cancelBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.cancelBooking(
    req.params.id,
    req.validated.body,
    req.user.USERID
  );
  return sendSuccess(res, data, "Booking cancelled successfully");
});

export const serveBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.serveBooking(
    req.params.id,
    req.validated.body,
    req.user.USERID
  );
  return sendSuccess(res, data, "Booking served successfully");
});

export const noShowBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.noShowBooking(
    req.params.id,
    req.validated.body,
    req.user.USERID
  );
  return sendSuccess(res, data, "Booking marked as no-show successfully");
});

export const toggleKioskController = asyncHandler(async (req, res) => {
  const data = await bookingService.toggleKiosk(
    req.params.dayMenuId,
    req.validated.body,
    req.user.USERID
  );
  return sendSuccess(res, data, "Kiosk availability toggled successfully");
});

export const scanRfidController = asyncHandler(async (req, res) => {
  const data = await bookingService.scanRfid(
    req.validated.body.PRFIDHASH,
    req.validated.body.PSERVICEID
  );
  return sendSuccess(res, data, "RFID scanned successfully");
});

export const serveBookingItemController = asyncHandler(async (req, res) => {
  const data = await bookingService.serveBookingItem(
    req.params.id,
    req.params.itemId,
    req.validated.body,
    req.user.USERID
  );
  return sendSuccess(res, data, "Booking item served successfully");
});

export const resolveBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.resolveBooking(req.params.identifier);
  return sendSuccess(res, data, "Booking resolved successfully");
});
