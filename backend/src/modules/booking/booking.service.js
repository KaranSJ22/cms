import * as bookingRepository from "./booking.repository.js";

export const getBooking = async (bookingId) => {
  const booking = await bookingRepository.getBooking(bookingId);
  if (!booking.HEADER) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }
  return booking;
};

export const listBookings = async (filters) => {
  return await bookingRepository.listBookings(filters);
};

export const createBooking = async (data, userId) => {
  return await bookingRepository.createBooking({
    ...data,
    PBOOKEDBY: userId,
  });
};

export const updateBookingItem = async (bookingId, itemId, data, userId) => {
  return await bookingRepository.updateBookingItem({
    PBOOKINGID: bookingId,
    PBOOKDTID: itemId,
    ...data,
    PCHANGEDBY: userId,
  });
};

export const cancelBooking = async (bookingId, data, userId) => {
  return await bookingRepository.cancelBooking({
    PBOOKINGID: bookingId,
    ...data,
    PCANCELLEDBY: userId,
  });
};

export const serveBooking = async (bookingId, data, userId) => {
  return await bookingRepository.serveBooking({
    PBOOKINGID: bookingId,
    ...data,
    PSERVEDBY: userId,
  });
};

export const noShowBooking = async (bookingId, data, userId) => {
  return await bookingRepository.noShowBooking({
    PBOOKINGID: bookingId,
    ...data,
    PCHANGEDBY: userId,
  });
};

export const toggleKiosk = async (dayMenuId, data, userId) => {
  return await bookingRepository.toggleKiosk({
    PDAYMENUID: dayMenuId,
    ...data,
    PCHANGEDBY: userId,
  });
};
