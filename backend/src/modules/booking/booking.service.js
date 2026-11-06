import * as bookingRepository from "./booking.repository.js";
import * as daymenuService from "../daymenu/daymenu.service.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../common/errors/appError.js";
import { isPastCutoff, toMySQLDate } from "../../utils/dateTime.js";

/**
 * Finds an active pre-booking (STATUSID = 30 'CRT') for a customer in a specific canteen + service + serving date.
 */
export const getActiveBookingForContext = async ({
  customerId,
  canteenId,
  serviceId,
  serviceDate,
}) => {
  return await bookingRepository.getActiveBookingContext({
    customerId,
    canteenId,
    serviceId,
    serviceDate: toMySQLDate(serviceDate),
  });
};

/**
 * Incrementally adds a new item to an existing active booking before BOOKUNTIL.
 */
export const addBookingItemIncremental = async ({
  bookingId,
  dayMenuId,
  qty,
  userId,
  customerId,
  ctypeCode,
}) => {
  const bookingInfo = await bookingRepository.getBooking(bookingId);
  if (!bookingInfo || !bookingInfo.HEADER) {
    throw new NotFoundError("Booking not found");
  }
  if (customerId && Number(bookingInfo.HEADER.CUSTOMERID) !== Number(customerId)) {
    throw new ForbiddenError("You do not have permission to modify this booking");
  }

  await bookingRepository.addBookingItemIncremental({
    bookingId: Number(bookingId),
    dayMenuId: Number(dayMenuId),
    qty: Number(qty),
    userId: Number(userId),
    remarks: `Added item (Qty: ${qty})`,
  });

  const refreshed = await bookingRepository.getBooking(bookingId);
  const addedItem = (refreshed.ITEMS || []).find((i) => Number(i.DAYMENUID) === Number(dayMenuId));

  return {
    BOOKITEMID: addedItem?.BOOKITEMID,
    BOOKID: Number(bookingId),
    DAYMENUID: Number(dayMenuId),
    QTY: addedItem?.QTY || Number(qty),
    RATE: Number(addedItem?.RATE || 0),
    AMOUNT: Number(addedItem?.AMOUNT || 0),
    STATUSID: 30,
    STATUSCODE: "CRT",
    TOTALITEMS: refreshed.HEADER.TOTALITEMS,
    TOTALQTY: refreshed.HEADER.TOTALQTY,
    TOTALAMOUNT: refreshed.HEADER.TOTALAMOUNT,
  };
};

/**
 * Incrementally modifies quantity of an existing active booking item before BOOKUNTIL.
 */
export const updateBookingItemQtyIncremental = async ({
  bookingId,
  itemId,
  qty,
  userId,
  customerId,
  ctypeCode,
}) => {
  const bookingInfo = await bookingRepository.getBooking(bookingId);
  if (!bookingInfo || !bookingInfo.HEADER) {
    throw new NotFoundError("Booking not found");
  }
  if (customerId && Number(bookingInfo.HEADER.CUSTOMERID) !== Number(customerId)) {
    throw new ForbiddenError("You do not have permission to modify this booking");
  }

  await bookingRepository.updateBookingItemQtyIncremental({
    itemId: Number(itemId),
    qty: Number(qty),
    userId: Number(userId),
    remarks: `Updated quantity to ${qty}`,
  });

  const refreshed = await bookingRepository.getBooking(bookingId);
  const updatedItem = (refreshed.ITEMS || []).find((i) => Number(i.BOOKITEMID) === Number(itemId));

  return {
    BOOKITEMID: Number(itemId),
    BOOKID: Number(bookingId),
    QTY: updatedItem?.QTY || Number(qty),
    RATE: Number(updatedItem?.RATE || 0),
    AMOUNT: Number(updatedItem?.AMOUNT || 0),
    STATUSID: updatedItem?.STATUSID || 30,
    STATUSCODE: updatedItem?.STATUSCODE || "CRT",
    TOTALITEMS: refreshed.HEADER.TOTALITEMS,
    TOTALQTY: refreshed.HEADER.TOTALQTY,
    TOTALAMOUNT: refreshed.HEADER.TOTALAMOUNT,
  };
};

/**
 * Incrementally cancels an existing booking item (soft-cancel, STATUSID = 33) before BOOKUNTIL.
 * If all items become cancelled, auto-cancels the booking header and clears CMS_PBACTIVE.
 */
export const cancelBookingItemIncremental = async ({
  bookingId,
  itemId,
  cancelReason = null,
  userId,
  customerId,
  ctypeCode,
}) => {
  const bookingInfo = await bookingRepository.getBooking(bookingId);
  if (!bookingInfo || !bookingInfo.HEADER) {
    throw new NotFoundError("Booking not found");
  }
  if (customerId && Number(bookingInfo.HEADER.CUSTOMERID) !== Number(customerId)) {
    throw new ForbiddenError("You do not have permission to modify this booking");
  }

  const result = await bookingRepository.cancelBookingItemIncremental({
    itemId: Number(itemId),
    userId: Number(userId),
    remarks: cancelReason || "Cancelled by customer",
  });

  const refreshed = await bookingRepository.getBooking(bookingId);
  const isBookingCancelled = result?.RESULT === "BOOKING_CANCELLED" || refreshed?.HEADER?.STATUSCODE === "CAN";

  return {
    BOOKITEMID: Number(itemId),
    BOOKID: Number(bookingId),
    STATUSID: 33,
    STATUSCODE: "CAN",
    BOOKING_CANCELLED: isBookingCancelled,
    TOTALITEMS: isBookingCancelled ? 0 : refreshed?.HEADER?.TOTALITEMS || 0,
    TOTALQTY: isBookingCancelled ? 0 : refreshed?.HEADER?.TOTALQTY || 0,
    TOTALAMOUNT: isBookingCancelled ? 0 : refreshed?.HEADER?.TOTALAMOUNT || 0,
  };
};

/**
 * Fetches published menu items and holidays for a weekly date range.
 */
export const getWeeklyPublishedMenuRaw = async ({ canteenId, startDate, endDate, ctypeCode }) => {
  const [menuRows, holidayRows] = await Promise.all([
    bookingRepository.getWeeklyMenuRange({
      canteenId,
      startDate,
      endDate,
      ctypeCode: ctypeCode || "VIS",
    }),
    bookingRepository.getHolidaysInRange(startDate, endDate),
  ]);

  return {
    menuItems: menuRows || [],
    holidays: holidayRows || [],
  };
};

/**
 * Fetches existing bookings for a customer in a date range.
 */
export const getExistingBookingsInRange = async ({ customerId, startDate, endDate }) => {
  return await bookingRepository.getExistingBookingsInRange({
    customerId,
    startDate,
    endDate,
  });
};

/**
 * Resolves active bookings by RFID access key hash.
 */
export const getBookingsByRfid = async (rfidHash, serviceId = null) => {
  // 1. Validate the RFID access key to get the customer
  const customer = await bookingRepository.validateAccessKey(rfidHash);
  if (!customer?.CUSTOMERID) {
    return [];
  }

  // 2. Fetch active ('CRT') bookings for today
  return await bookingRepository.getTodayActiveBookings(customer.CUSTOMERID, serviceId);
};

// ===========================================================================
// CORE SERVICE WORKFLOWS
// ===========================================================================

export const getBooking = async (bookingId, user = null) => {
  const booking = await bookingRepository.getBooking(bookingId);
  if (!booking.HEADER) {
    throw new NotFoundError("Booking not found");
  }

  if (user && user.CUSTOMERID && booking.HEADER.CUSTOMERID !== user.CUSTOMERID) {
    throw new ForbiddenError("You do not have permission to view this booking");
  }

  return booking;
};

export const getActiveBooking = async ({ customerId, canteenId, serviceId, serviceDate }) => {
  const activeBooking = await getActiveBookingForContext({
    customerId,
    canteenId,
    serviceId,
    serviceDate,
  });

  return activeBooking;
};

async function fetchBookingsWithCanteenFilter(filters) {
  return await bookingRepository.listBookings(filters);
}

export const listBookings = async (filters, user = null) => {
  const finalFilters = { ...filters };
  const hasCanteenRole = (user?.CANTEENROLES || []).length > 0;
  const isSysAdmin = (user?.SYSTEMROLES || []).includes("SYSADM");

  // Only restrict to personal customerId if user is purely a customer (no canteen staff/admin privileges)
  if (!hasCanteenRole && !isSysAdmin && user && user.CUSTOMERID) {
    finalFilters.PCUSTOMERID = user.CUSTOMERID;
  }

  // If user has canteen staff/manager role, enforce/validate canteen access
  if (hasCanteenRole && !isSysAdmin) {
    const userCanteenIds = (user.CANTEENROLES || []).map((r) => Number(r.CANTEENID));
    if (finalFilters.PCANTEENID) {
      if (!userCanteenIds.includes(Number(finalFilters.PCANTEENID))) {
        throw new ForbiddenError("Access denied: You do not have permissions for this canteen");
      }
    } else {
      // Default to their primary / first assigned canteen if not specified
      finalFilters.PCANTEENID = userCanteenIds[0] || null;
    }
  }

  // If pagination is requested for customer booking history
  if (finalFilters.page || finalFilters.pageSize) {
    const customerId = finalFilters.PCUSTOMERID || finalFilters.customerId;
    if (customerId) {
      const pageNum = Number(finalFilters.page) || 1;
      const pageSizeNum = Number(finalFilters.pageSize) || 10;

      const rows = await bookingRepository.listBookingHistory({
        customerId,
        startDate: finalFilters.PSTARTDATE || finalFilters.startDate || null,
        endDate: finalFilters.PENDDATE || finalFilters.endDate || null,
        statusCode: finalFilters.PSTATUS || finalFilters.status || null,
        page: pageNum,
        pageSize: pageSizeNum,
      });

      const totalRows = Number(rows[0]?.TOTALROWS || 0);
      const limit = Number(rows[0]?.PAGESIZE || pageSizeNum);
      const totalPages = Number(rows[0]?.TOTALPAGES || (totalRows > 0 ? Math.ceil(totalRows / limit) : 1));
      const currentPage = Number(rows[0]?.CURRENTPAGE || pageNum);

      return {
        rows,
        pagination: {
          totalRows,
          currentPage,
          pageSize: limit,
          totalPages,
        },
      };
    }
  }

  return await fetchBookingsWithCanteenFilter(finalFilters);
};

export const fetchKitchenPrep = async (daySlotId) => {
  return await bookingRepository.getKitchenPrep(daySlotId);
};

export const createBooking = async (data, user) => {
  const customerId = user?.CUSTOMERID || data.PCUSTOMERID;

  // Validate BOOKUNTIL in batch
  if (data.PITEMSJSON && data.PITEMSJSON.length > 0) {
    const dayMenuIds = data.PITEMSJSON.map((item) => item.DAYMENUID).filter(Boolean);
    const menuDetails = await daymenuService.getDayMenusByIds(dayMenuIds);
    for (const menuDetail of menuDetails) {
      if (isPastCutoff(menuDetail.BOOKUNTIL)) {
        throw new BadRequestError(`Booking window has closed for item: ${menuDetail.ITEMNAME}`);
      }
    }
  }

  return await bookingRepository.createBooking({
    ...data,
    PCUSTOMERID: customerId,
    PBOOKEDBY: user.USERID,
  });
};

export const addBookingItem = async (bookingId, itemData, user) => {
  return await addBookingItemIncremental({
    bookingId: Number(bookingId),
    dayMenuId: Number(itemData.DAYMENUID),
    qty: Number(itemData.QTY),
    userId: user.USERID,
    customerId: user.CUSTOMERID,
    ctypeCode: user.CTYPECODE,
  });
};

export const updateBookingItemQty = async (bookingId, itemId, data, user) => {
  const qty = data.QTY !== undefined ? data.QTY : data.PQTY;
  return await updateBookingItemQtyIncremental({
    bookingId: Number(bookingId),
    itemId: Number(itemId),
    qty: Number(qty),
    userId: user.USERID,
    customerId: user.CUSTOMERID,
    ctypeCode: user.CTYPECODE,
  });
};

export const updateBookingItemsBatch = async (bookingId, items, user) => {
  const bookingInfo = await bookingRepository.getBooking(bookingId);
  if (!bookingInfo || !bookingInfo.HEADER) {
    throw new NotFoundError("Booking not found");
  }

  if (user && user.CUSTOMERID && bookingInfo.HEADER.CUSTOMERID !== user.CUSTOMERID) {
    throw new ForbiddenError("You do not have permission to modify this booking");
  }

  if (bookingInfo.HEADER.STATUSCODE !== "CRT") {
    throw new BadRequestError("Only active bookings can be edited");
  }

  // If user removes all items, cancel the booking entirely and refund full balance
  if (!items || items.length === 0) {
    await cancelBooking(
      bookingId,
      { PCANCELREASON: "All items removed by user in edit meal planner" },
      user
    );
    return await bookingRepository.getBooking(bookingId);
  }

  const formattedItems = items.map((i) => ({
    DAYMENUID: Number(i.dayMenuId || i.DAYMENUID),
    QTY: Number(i.qty || i.QTY),
  }));

  await bookingRepository.updateBookingItem({
    PBOOKINGID: Number(bookingId),
    PITEMSJSON: formattedItems,
    PCHANGEDBY: user.USERID,
  });

  return await bookingRepository.getBooking(bookingId);
};

export const cancelBookingItem = async (bookingId, itemId, data, user) => {
  return await cancelBookingItemIncremental({
    bookingId: Number(bookingId),
    itemId: Number(itemId),
    cancelReason: data?.PCANCELREASON || null,
    userId: user.USERID,
    customerId: user.CUSTOMERID,
    ctypeCode: user.CTYPECODE,
  });
};

export const cancelBooking = async (bookingId, data, user) => {
  const bookingInfo = await bookingRepository.getBooking(bookingId);
  if (!bookingInfo || !bookingInfo.HEADER) {
    throw new NotFoundError("Booking not found");
  }

  if (user && user.CUSTOMERID && bookingInfo.HEADER.CUSTOMERID !== user.CUSTOMERID) {
    throw new ForbiddenError("You do not have permission to cancel this booking");
  }

  // Check if past cancel cutoff
  const activeItems = (bookingInfo.ITEMS || []).filter(
    (item) => item.STATUSCODE === "CRT" || item.STATUSID === 30
  );

  for (const item of activeItems) {
    const menuDetail = await daymenuService.getDayMenuById(item.DAYMENUID);
    if (menuDetail && isPastCutoff(menuDetail.BOOKUNTIL)) {
      throw new BadRequestError(`Cancellation window has closed for item: ${menuDetail.ITEMNAME}`);
    }
  }

  return await bookingRepository.cancelBooking({
    PBOOKINGID: Number(bookingId),
    ...data,
    PCANCELLEDBY: user.USERID,
  });
};

/**
 * Validates that an operation cannot be performed on a future-dated booking.
 */
const assertNotFutureBooking = async (bookingId, actionDescription) => {
  const booking = await bookingRepository.getBooking(bookingId);
  const servDate = booking?.HEADER?.SERVICEDATE;
  if (!servDate) return;

  const servDateStr =
    typeof servDate === "string"
      ? servDate.slice(0, 10)
      : new Date(servDate).toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (servDateStr > todayStr) {
    throw new BadRequestError(
      `Cannot ${actionDescription} a future booking before its scheduled date (Scheduled: ${servDateStr}, Today: ${todayStr})`
    );
  }
};

export const serveBooking = async (bookingId, data, userId, kioskId = null) => {
  await assertNotFutureBooking(bookingId, "serve");
  return await bookingRepository.serveBooking({
    PBOOKINGID: Number(bookingId),
    ...data,
    PSERVEDBY: userId,
    PKIOSKID: kioskId,
  });
};

export const noShowBooking = async (bookingId, data, userId) => {
  await assertNotFutureBooking(bookingId, "mark as no-show");
  return await bookingRepository.noShowBooking({
    PBOOKINGID: Number(bookingId),
    ...data,
    PCHANGEDBY: userId,
  });
};

export const toggleKiosk = async (dayMenuId, data, userId) => {
  return await bookingRepository.toggleKiosk({
    PDAYMENUID: Number(dayMenuId),
    ...data,
    PCHANGEDBY: userId,
  });
};

export const scanRfid = async (rfidHash, serviceId) => {
  const bookings = await getBookingsByRfid(rfidHash, serviceId);

  if (!bookings || bookings.length === 0) {
    throw new NotFoundError("No active bookings found for this RFID");
  }

  return bookings;
};

export const serveBookingItem = async (bookingId, itemId, data, userId) => {
  await assertNotFutureBooking(bookingId, "serve an item from");
  return await bookingRepository.serveBookingItem({
    PBOOKINGID: Number(bookingId),
    PBOOKITEMID: Number(itemId),
    PSERVEDBY: userId,
    PKIOSKID: data?.PKIOSKID || null,
    PCHGREASON: data?.PSERVEREASON || data?.CHGREASON || "Served at counter",
  });
};

// export const resolveBooking = async (identifier, canteenId = null, serviceId = null, kioskId = null, daySlotId = null) => {
//   const booking = await bookingRepository.resolveBookingByIdentifier(identifier, canteenId, serviceId, kioskId, daySlotId);
//   if (!booking) {
//     throw new NotFoundError("No active booking found for this identifier");
//   }
//   return booking;
// };
export const resolveBooking = async (identifier, canteenId = null, serviceId = null, kioskId = null, daySlotId = null) => {
  let targetIdentifier = (identifier || "").trim();

  // If identifier is a 10-digit phone number, resolve to CUSTOMERID first (Supports visitors without RFID)
  const isPhoneNumber = /^[6-9]\d{9}$/.test(targetIdentifier);
  if (isPhoneNumber) {
    const matchedCustomer = await bookingRepository.findCustomerByPhone(targetIdentifier);
    if (matchedCustomer?.CUSTOMERID) {
      targetIdentifier = String(matchedCustomer.CUSTOMERID);
    }
  }

  let booking = null;
  try {
    booking = await bookingRepository.resolveBookingByIdentifier(
      targetIdentifier,
      canteenId,
      serviceId,
      kioskId,
      daySlotId
    );
  } catch (err) {
    // If original resolution failed with an employee error, give a friendly message
    throw new NotFoundError(`No active booking found today for identifier: ${identifier}`);
  }

  if (!booking || !booking.HEADER) {
    throw new NotFoundError("No active booking found for this identifier");
  }

  return booking;
};



export const createWeeklyBookingBatch = async (data, user) => {
  const customerId = user?.CUSTOMERID || data.PCUSTOMERID;
  if (!customerId) {
    throw new BadRequestError("Customer profile not found");
  }

  const createdBookings = await bookingRepository.createWeeklyBookingBatch({
    PBOOKTYPECODE: data.PBOOKTYPECODE || "PB",
    PCUSTOMERID: customerId,
    PBOOKINGSJSON: data.PBOOKINGSJSON,
    PBOOKEDBY: user.USERID,
    PREMARKS: data.PREMARKS || "5-Day Weekly Pass",
  });

  return createdBookings;
};

export const getWeeklyPublishedMenu = async ({ canteenId, startDate, endDate }, user = null) => {
  const ctypeCode = user?.CTYPECODE || "VIS";
  const { menuItems, holidays } = await getWeeklyPublishedMenuRaw({
    canteenId,
    startDate,
    endDate,
    ctypeCode,
  });

  let existingBookings = [];
  if (user?.CUSTOMERID) {
    existingBookings = await getExistingBookingsInRange({
      customerId: user.CUSTOMERID,
      startDate,
      endDate,
    });
  }

  // Helper to get pure 'YYYY-MM-DD' string without timezone shift
  const normalizeDateStr = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val.slice(0, 10);
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return String(val).slice(0, 10);
  };

  // Create an existing bookings map: "YYYY-MM-DD_SERVICEID" -> booking
  const existingBookingsMap = {};
  for (const eb of existingBookings) {
    const dateStr = normalizeDateStr(eb.SERVICEDATE);
    const key = `${dateStr}_${eb.SERVICEID}`;
    existingBookingsMap[key] = eb;
  }

  // Holiday dates set for O(1) lookup
  const holidayMap = {};
  for (const h of holidays) {
    const hDateStr = normalizeDateStr(h.HOLIDAYDATE);
    holidayMap[hDateStr] = h.HOLIDAYNAME;
  }

  // Group items by date and then by service
  const daysMap = {};

  // First, populate closed holidays so even days with no menu rows are represented
  for (const h of holidays) {
    const hDateStr = normalizeDateStr(h.HOLIDAYDATE);
    if (!daysMap[hDateStr]) {
      daysMap[hDateStr] = {
        date: hDateStr,
        isHoliday: true,
        isSpecialHolidayService: false,
        holidayName: h.HOLIDAYNAME,
        services: {},
      };
    }
  }

  for (const item of menuItems) {
    const dateStr = normalizeDateStr(item.SERVDATE);
    const hasHoliday = Boolean(holidayMap[dateStr]);

    if (!daysMap[dateStr]) {
      daysMap[dateStr] = {
        date: dateStr,
        isHoliday: false,
        isSpecialHolidayService: hasHoliday,
        holidayName: holidayMap[dateStr] || null,
        services: {},
      };
    } else if (hasHoliday) {
      // Published menu exists on this holiday -> Manager enabled service!
      daysMap[dateStr].isHoliday = false;
      daysMap[dateStr].isSpecialHolidayService = true;
    }

    const sId = item.SERVICEID;
    if (!daysMap[dateStr].services[sId]) {
      const existingKey = `${dateStr}_${sId}`;
      daysMap[dateStr].services[sId] = {
        serviceId: sId,
        servCode: item.SERVCODE,
        servName: item.SERVNAME,
        startTime: item.STARTTIME,
        endTime: item.ENDTIME,
        existingBooking: existingBookingsMap[existingKey] || null,
        baseItem: null,
        items: [],
      };
    }

    daysMap[dateStr].services[sId].items.push(item);
    if (item.ISBASE === 1 && !daysMap[dateStr].services[sId].baseItem) {
      daysMap[dateStr].services[sId].baseItem = item;
    }
  }

  // Extract distinct services present in the weekly menu
  const serviceMap = new Map();
  for (const item of menuItems) {
    if (!serviceMap.has(item.SERVICEID)) {
      serviceMap.set(item.SERVICEID, {
        SERVICEID: item.SERVICEID,
        SERVCODE: item.SERVCODE,
        SERVNAME: item.SERVNAME,
        STARTTIME: item.STARTTIME,
        ENDTIME: item.ENDTIME,
      });
    }
  }
  const services = Array.from(serviceMap.values());

  return {
    canteenId,
    startDate,
    endDate,
    holidays,
    daysMap,
    existingBookings,
    services,
  };
};
