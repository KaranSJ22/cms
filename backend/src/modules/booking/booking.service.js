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

export const scanRfid = async (rfidHash, serviceId) => {
  const bookings = await bookingRepository.getBookingsByRfid(rfidHash, serviceId);
  
  if (!bookings || bookings.length === 0) {
    const error = new Error("No active bookings found for this RFID");
    error.statusCode = 404;
    throw error;
  }

  // Dynamically import to avoid circular dependencies if any
  import("../../utils/socket.js").then(({ getIO }) => {
    try {
      const io = getIO();
      io.to("canteen_dashboard").emit("rfid_scanned", {
        rfidHash,
        bookings,
      });
    } catch (e) {
      console.error("Socket emit failed", e);
    }
  });

  return bookings;
};

export const serveBookingItem = async (bookingId, itemId, data, userId) => {
  // Uses existing update item proc. We assume the proc handles STATUS changes.
  return await bookingRepository.updateBookingItem({
    PBOOKINGID: bookingId,
    PBOOKDTID: itemId,
    PQTY: data.PQTY || 1,
    PSTATUS: 'SRV',
    PCHANGEDBY: userId,
    PCHGREASON: data.PSERVEREASON || 'Served at kiosk',
  });
};
