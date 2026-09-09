import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as bookingService from "./booking.service.js";

export const getActiveBookingController = asyncHandler(async (req, res) => {
  const customerId = req.user.CUSTOMERID || req.query.customerId;
  if (!customerId) {
    return sendSuccess(res, null, "No customer identified");
  }

  const data = await bookingService.getActiveBooking({
    customerId: Number(customerId),
    canteenId: Number(req.query.canteenId),
    serviceId: Number(req.query.serviceId),
    serviceDate: req.query.serviceDate,
  });

  return sendSuccess(res, data, "Active booking fetched successfully");
});

export const getBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.getBooking(req.params.id, req.user);
  return sendSuccess(res, data, "Booking fetched successfully");
});

export const getBookingsController = asyncHandler(async (req, res) => {
  const filters = {
    PCUSTOMERID: req.query.customerId,
    PSERVICEID: req.query.serviceId,
    PSTARTDATE: req.query.startDate || req.query.fromDate,
    PENDDATE: req.query.endDate || req.query.toDate,
    PSTATUS: req.query.status
  };
  const data = await bookingService.listBookings(filters, req.user);
  return sendSuccess(res, data, "Bookings retrieved successfully");
});

export const getKitchenPrepController = asyncHandler(async (req, res) => {
  const data = await bookingService.fetchKitchenPrep(req.validated.query.daySlotId);
  return sendSuccess(res, data, "Kitchen prep data retrieved successfully");
});

export const createBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.validated.body, req.user);
  return sendSuccess(res, data, "Booking created successfully", 201);
});

export const addBookingItemController = asyncHandler(async (req, res) => {
  const data = await bookingService.addBookingItem(
    req.params.id,
    req.validated.body,
    req.user
  );
  return sendSuccess(res, data, "Booking item added successfully", 201);
});

export const updateBookingItemController = asyncHandler(async (req, res) => {
  const data = await bookingService.updateBookingItemQty(
    req.params.id,
    req.params.itemId,
    req.validated.body,
    req.user
  );
  return sendSuccess(res, data, "Booking item updated successfully");
});

export const cancelBookingItemController = asyncHandler(async (req, res) => {
  const data = await bookingService.cancelBookingItem(
    req.params.id,
    req.params.itemId,
    req.validated.body,
    req.user
  );
  return sendSuccess(res, data, "Booking item cancelled successfully");
});

export const cancelBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.cancelBooking(
    req.params.id,
    req.validated.body,
    req.user
  );
  return sendSuccess(res, data, "Booking cancelled successfully");
});

export const serveBookingController = asyncHandler(async (req, res) => {
  const data = await bookingService.serveBooking(
    req.params.id,
    req.validated.body,
    req.user.USERID,
    req.kiosk?.kioskId || null
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
  const canteenId = req.query.canteenId || req.user?.CANTEENROLES?.[0]?.CANTEENID || null;
  const serviceId = req.query.serviceId || null;
  const kioskId = req.query.kioskId || null;
  const daySlotId = req.query.daySlotId || null;
  const data = await bookingService.resolveBooking(req.params.identifier, canteenId, serviceId, kioskId, daySlotId);
  return sendSuccess(res, data, "Booking resolved successfully");
});

export const createWeeklyBookingBatchController = asyncHandler(async (req, res) => {
  const result = await bookingService.createWeeklyBookingBatch(req.body, req.user);
  return sendSuccess(res, result, "Weekly meal pass booked successfully!", 201);
});

export const getWeeklyPublishedMenuController = asyncHandler(async (req, res) => {
  const result = await bookingService.getWeeklyPublishedMenu(
    {
      canteenId: req.query.canteenId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    },
    req.user
  );
  return sendSuccess(res, result, "Weekly published menu retrieved successfully");
});

