import * as KioskRepository from "./kiosk.repository.js";
import * as bookingService from "../booking/booking.service.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../common/errors/appError.js";
import dayjs from "dayjs";

/**
 * Boot handshake: Resolves kiosk identity from client IP
 */
export const getKioskConfig = async (clientIp) => {
  const normalizedIp = clientIp?.startsWith("::ffff:") ? clientIp.substring(7) : clientIp;
  const targetIp = normalizedIp === "::1" ? "127.0.0.1" : normalizedIp;

  try {
    const device = await KioskRepository.identifyKioskDevice(targetIp);

    if (!device) {
      return {
        registered: false,
        ipAddress: targetIp,
        message: "This terminal IP is not registered in the CMS Kiosk Device table.",
      };
    }

    return {
      registered: true,
      kioskId: device.KIOSKID,
      deviceCode: device.DEVICECODE,
      deviceName: device.DEVICENAME,
      ipAddress: device.IPADDRESS,
      canteenId: device.CANTEENID,
      canteenName: device.CANTEENNAME,
      canteenCode: device.CANTEENCODE,
      kioskType: device.KIOSKTYPE, // 'STAFF_COUNTER' | 'EMP_SELF_SERVICE'
      isActive: device.ISACTIVE === 1,
    };
  } catch (err) {
    return {
      registered: false,
      ipAddress: targetIp,
      message: err.message || "Unregistered kiosk terminal",
    };
  }
};

/**
 * Scan RFID at Employee Self-Service Kiosk
 * Returns employee profile, active bookings, and wallet ONLY if contract worker or visitor
 */
export const scanSelfService = async (data) => {
  const loginInfo = await KioskRepository.getLoginInfo(data.PIDENTIFIER);
  if (!loginInfo || !loginInfo.CUSTOMER) {
    throw new NotFoundError(`Employee with ID or RFID card "${data.PIDENTIFIER}" was not found or has no active profile.`);
  }

  const customer = loginInfo.CUSTOMER;
  const customerId = customer.CUSTOMERID;
  const user = loginInfo.USER;

  // Active bookings: Today and future
  const today = dayjs().format("YYYY-MM-DD");
  const rawBookings = await KioskRepository.listBookings(customerId, data.PSERVICEID, today, null);
  
  // Filter for active/pending bookings (CRT = 30)
  const upcomingBookings = (rawBookings || []).filter(
    (b) => b.STATUSCODE === "CRT" || b.STATUSID === 30
  );

  // Business Rule: Wallet is displayed ONLY for Contract Employees and Visitors
  const isContractOrVisitor = ["CONTEMP", "CNT", "VIS", "VISITOR"].includes(customer.CTYPECODE);

  let wallet = null;
  if (isContractOrVisitor) {
    const walletRecord = await KioskRepository.getCustomerWallet(customerId);
    wallet = {
      balance: walletRecord ? Number(walletRecord.BALANCE) : 0,
      reserved: walletRecord ? Number(walletRecord.RESERVEDAMT || 0) : 0,
      statusId: walletRecord ? walletRecord.STATUSID : 10,
    };
  }

  return {
    customer: {
      customerId: customer.CUSTOMERID,
      displayName: customer.DISPNAME,
      customerTypeCode: customer.CTYPECODE,
      loginId: customer.LOGINID || user?.LOGINID || "",
      isWalletEligible: isContractOrVisitor,
    },
    wallet,
    upcomingBookings,
  };
};

/**
 * Gets tomorrow's kiosk-enabled menu for self-service pre-booking
 */
export const getNextDayMenu = async (canteenId) => {
  const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
  const items = await KioskRepository.getNextDayKioskMenu(canteenId, tomorrow);

  // Group items by meal service
  const serviceMap = new Map();
  for (const item of items) {
    if (!serviceMap.has(item.SERVICEID)) {
      serviceMap.set(item.SERVICEID, {
        serviceId: item.SERVICEID,
        serviceName: item.SERVNAME,
        startTime: item.STARTTIME,
        endTime: item.ENDTIME,
        serviceDate: tomorrow,
        items: [],
      });
    }
    serviceMap.get(item.SERVICEID).items.push({
      dayMenuId: item.DAYMENUID,
      daySlotId: item.DAYSLOTID,
      menuItemId: item.MENUITEMID,
      menuCode: item.MENUCODE,
      shortName: item.SHORTNAME,
      itemName: item.ITEMNAME,
      itemDesc: item.ITEMDESC,
      isVeg: item.ISVEG,
      rate: Number(item.RATE || 0),
      bookUntil: item.BOOKUNTIL,
      cancelUntil: item.CANCELUNTIL,
      availQty: item.AVAILQTY,
      maxQty: item.MAXQTY,
    });
  }

  return {
    targetDate: tomorrow,
    services: Array.from(serviceMap.values()),
  };
};

/**
 * Next-day self-service pre-booking
 */
export const bookNextDay = async (data, kiosk = null) => {
  const today = dayjs().format("YYYY-MM-DD");
  const serviceDate = dayjs(data.SERVICEDATE).format("YYYY-MM-DD");

  // Strict Constraint: Kiosk pre-booking is allowed ONLY for tomorrow or later
  if (serviceDate <= today) {
    throw new BadRequestError(
      "Self-service kiosk bookings are strictly allowed for tomorrow or upcoming days. Same-day bookings cannot be created at this terminal."
    );
  }

  const formattedItems = (data.ITEMS || []).map((item) => ({
    DAYMENUID: item.DAYMENUID,
    MENUITEMID: item.MENUITEMID,
    QTY: item.QTY,
  }));

  // Resolve user id from customer record
  const customerRow = await KioskRepository.getCustomerUser(data.CUSTOMERID);
  const userId = customerRow?.USERID || 1; // Fallback to system admin if customer has no user account

  const bookingResult = await bookingService.createBooking(
    {
      PBOOKTYPECODE: "KS", // Kiosk Booking type
      PSERVICEID: data.SERVICEID,
      PSERVICEDATE: serviceDate,
      PCUSTOMERID: data.CUSTOMERID,
      PITEMSJSON: formattedItems,
      PKIOSKID: kiosk?.kioskId || null,
      PREMARKS: `Booked via Self-Service Kiosk [${kiosk?.deviceCode || "UNKNOWN"}]`,
    },
    { USERID: userId, CUSTOMERID: data.CUSTOMERID }
  );

  return bookingResult;
};

/**
 * Cancel active booking from Self-Service Kiosk
 */
export const cancelKioskBooking = async (data, kiosk = null) => {
  const bookingId = Number(data.BOOKINGID);
  const customerId = Number(data.CUSTOMERID);

  // Verify booking belongs to this customer and is still active
  const booking = await KioskRepository.getBookingBasic(bookingId);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }
  if (booking.CUSTOMERID !== customerId) {
    throw new ForbiddenError("You do not have permission to cancel this booking");
  }
  if (booking.STATUSID !== 30) {
    throw new BadRequestError("Only active/created bookings (CRT) can be cancelled");
  }

  // Resolve user id for audit tracking
  const customerRow = await KioskRepository.getCustomerUser(customerId);
  const userId = customerRow?.USERID || 1;

  const result = await KioskRepository.cancelBooking(
    bookingId,
    userId,
    data.CANCELREASON || `Cancelled at Kiosk [${kiosk?.deviceCode || "Self-Service"}]`
  );

  return result;
};

/**
 * Record heartbeat
 */
export const recordHeartbeat = async (kioskId, clientIp) => {
  return await KioskRepository.recordHeartbeat(kioskId, clientIp);
};

/**
 * Gets currently active or next upcoming meal slot for a kiosk terminal
 */
export const getCurrentSlot = async (canteenId = null, kioskId = null) => {
  return await KioskRepository.getCurrentSlot(canteenId, kioskId);
};

/**
 * Resolves a booking for serving counter with meal slot and time-window awareness
 */
export const resolveServingBooking = async (identifier, canteenId = null, kioskId = null, daySlotId = null) => {
  const booking = await KioskRepository.resolveKioskBooking(identifier, canteenId, kioskId, daySlotId);
  if (!booking) {
    const error = new Error("No active booking found for this identifier in this canteen facility");
    error.statusCode = 404;
    throw error;
  }
  return booking;
};

/**
 * Marks a booking as served from the kiosk terminal with operator attribution
 */
export const serveBooking = async (bookingId, userId, kioskId = null) => {
  return await KioskRepository.serveKioskBooking(bookingId, userId, kioskId);
};

/**
 * Retrieves all active canteens
 */
export const getActiveCanteens = async () => {
  return await KioskRepository.getActiveCanteens();
};

/**
 * Retrieves all meal slots scheduled for today at a canteen
 */
export const getTodaySlots = async (canteenId) => {
  return await KioskRepository.getTodaySlots(canteenId);
};


