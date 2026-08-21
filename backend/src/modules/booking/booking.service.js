import * as bookingRepository from "./booking.repository.js";
import * as daymenuRepository from "../daymenu/daymenu.repository.js";

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

export const fetchKitchenPrep = async (daySlotId) => {
  return await bookingRepository.getKitchenPrep(daySlotId);
};

export const createBooking = async (data, userId) => {
  // Validate BOOKUNTIL
  if (data.PITEMSJSON && data.PITEMSJSON.length > 0) {
    const now = new Date();
    for (const item of data.PITEMSJSON) {
      const menuDetail = await daymenuRepository.getDayMenuById(item.DAYMENUID);
      if (menuDetail && menuDetail.BOOKUNTIL) {
        const bookUntil = new Date(menuDetail.BOOKUNTIL);
        if (now > bookUntil) {
          const error = new Error(`Booking window has closed for item: ${menuDetail.ITEMNAME}`);
          error.statusCode = 400;
          throw error;
        }
      }
    }
  }

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
  // Validate CANCELUNTIL
  const bookingInfo = await bookingRepository.getBooking(bookingId);
  if (!bookingInfo || !bookingInfo.ITEMS || bookingInfo.ITEMS.length === 0) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  for (const item of bookingInfo.ITEMS) {
    const menuDetail = await daymenuRepository.getDayMenuById(item.DAYMENUID);
    if (menuDetail && menuDetail.CANCELUNTIL) {
      const cancelUntil = new Date(menuDetail.CANCELUNTIL);
      if (now > cancelUntil) {
        const error = new Error(`Cancellation window has closed for item: ${menuDetail.ITEMNAME}`);
        error.statusCode = 400;
        throw error;
      }
    }
  }

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

export const scanRfid = async (rfidHash, serviceId) => {
  const bookings = await bookingRepository.getBookingsByRfid(rfidHash, serviceId);

  if (!bookings || bookings.length === 0) {
    const error = new Error("No active bookings found for this RFID");
    error.statusCode = 404;
    throw error;
  }
};

export const serveBookingItem = async (bookingId, itemId, data, userId) => {
  return await bookingRepository.updateBookingItem({
    PBOOKINGID: bookingId,
    PBOOKDTID: itemId,
    PQTY: data.PQTY || 1,
    PSTATUS: 'SRV',
    PCHANGEDBY: userId,
    PCHGREASON: data.PSERVEREASON || 'Served at kiosk',
  });
};

export const resolveBooking = async (identifier) => {
  const booking = await bookingRepository.resolveBookingByIdentifier(identifier);
  if (!booking) {
    const error = new Error("No active booking found for this identifier");
    error.statusCode = 404;
    throw error;
  }
  return booking;
};


