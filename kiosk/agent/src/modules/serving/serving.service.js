import crypto from "crypto";
import { centralClient } from "../sync/sync.client.js";
import * as ServingRepository from "./serving.repository.js";
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from "../../common/errors/appError.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const ALLOWED_STAFF_ROLES = ["CNTSTF", "CNTMGR", "CTNMNG", "CNTAST", "CTNAST", "SYSADM"];

/**
 * 1. Staff Shift Login
 * Authenticates against central auth and validates assigned canteen staff roles
 */
export const staffLogin = async (loginId, password, rfidUid) => {
  const cleanId = (loginId || "").trim();
  const cleanPwd = (password || "").trim();
  const cleanRfid = (rfidUid || "").trim();

  if (!cleanId && !cleanRfid) {
    throw new BadRequestError("Staff Login ID or RFID badge scan is required");
  }

  try {
    const res = await centralClient.post(
      "/kiosk/counter/login",
      {
        loginId: cleanId || undefined,
        password: cleanPwd || undefined,
        rfidUid: cleanRfid || undefined,
      },
      { timeout: 3500 }
    );

    const data = res.data?.DATA || res.data;
    if (!data?.token || !data?.user) {
      throw new UnauthorizedError("Authentication failed: invalid server response");
    }

    return data;
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      throw new UnauthorizedError(err.response?.data?.MESSAGE || "Invalid Staff Badge, Login ID or Password");
    }
    throw new BadRequestError(err.message || "Failed to authenticate staff with central server");
  }
};

/**
 * 2. Resolve Active Booking for Serving Counter (Online-First with SQLite fallback)
 */
export const resolveServingBooking = async (identifier, canteenId, kioskId, daySlotId) => {
  const cleanId = (identifier || "").trim();
  if (!cleanId) {
    throw new BadRequestError("Identifier or card scan is required");
  }

  const effectiveCanteenId = canteenId ? Number(canteenId) : Number(env.CANTEEN_ID || 1);

  // 1. Direct Central Attempt (1.5s Intranet Timeout)
  try {
    const res = await centralClient.get(`/kiosk/counter/resolve/${encodeURIComponent(cleanId)}`, {
      params: {
        canteenId: effectiveCanteenId,
        kioskId: kioskId || env.KIOSK_ID || null,
        daySlotId: daySlotId || null,
      },
      timeout: 1500,
    });

    const data = res.data?.DATA || res.data;
    if (data && data.HEADER) {
      return {
        ...data,
        isLiveOnline: true,
      };
    }
  } catch (err) {
    logger.warn({ err: err.message }, "Central resolve timed out or failed; falling back to SQLite");
  }

  // 2. Offline Fallback: Local SQLite cached_today_bookings
  const header = ServingRepository.findTodayBookingByIdentifier(cleanId);
  if (!header) {
    throw new NotFoundError(
      `No active booking found for "${cleanId}" in today's local canteen manifest.`
    );
  }

  const items = ServingRepository.getBookingLineItems(header.book_id);

  return {
    HEADER: {
      BOOKID: header.book_id,
      BOOKNO: header.book_no,
      CUSTOMERID: header.customer_id,
      LOGINID: header.login_id,
      CUSTOMERNAME: header.disp_name,
      CTYPECODE: header.ctype_code,
      SERVNAME: header.slot_name,
      CANTEENNAME: `Canteen ${effectiveCanteenId}`,
      STATUSCODE: header.status_code,
      SERVEDBY: header.served_by,
      SERVEDON: header.served_on,
      TOTALAMOUNT: header.total_amount,
      ISINWINDOW: 1,
    },
    ITEMS: items,
    isLiveOnline: false,
  };
};

/**
 * 3. Mark Booking as Served (Online-First with Outbox fallback)
 */
export const serveBooking = async (bookingId, kioskId, staffToken, staffUserId) => {
  const cleanBookId = Number(bookingId);
  const effectiveKioskId = kioskId ? Number(kioskId) : Number(env.KIOSK_ID || 1);

  // 1. Direct Central Call
  try {
    const res = await centralClient.post(
      "/kiosk/counter/serve",
      { bookingId: cleanBookId, kioskId: effectiveKioskId },
      {
        headers: staffToken ? { Authorization: staffToken.startsWith("Bearer ") ? staffToken : `Bearer ${staffToken}` } : {},
        timeout: 2000,
      }
    );

    // Update local SQLite cache if record exists
    ServingRepository.markBookingServedLocally(cleanBookId, staffUserId || 1);

    return {
      ...(res.data?.DATA || res.data || {}),
      isLiveOnline: true,
    };
  } catch (err) {
    logger.warn({ err: err.message }, "Central serve failed; queuing to offline serving outbox");

    // 2. Offline Fallback
    const eventUuid = crypto.randomUUID();

    // Mark served locally to prevent duplicate collection
    ServingRepository.markBookingServedLocally(cleanBookId, staffUserId || 1);

    // Queue in outbox_serving_events
    ServingRepository.queueServingOutboxEvent(eventUuid, {
      bookingId: cleanBookId,
      kioskId: effectiveKioskId,
      servedBy: staffUserId || 1,
      servedOn: new Date().toISOString(),
    });

    return {
      bookId: cleanBookId,
      statusCode: "SRV",
      statusText: "Served (Saved Locally)",
      isLiveOnline: false,
    };
  }
};

/**
 * 4. Cancel Booking at Counter with Automatic Refund
 */
export const cancelCounterBooking = async (bookingId, cancelReason, staffToken, staffUserId) => {
  const cleanBookId = Number(bookingId);
  const reason = cancelReason || `Cancelled at Serving Counter by Staff [User #${staffUserId || 1}]`;

  try {
    const res = await centralClient.post(
      "/kiosk/counter/cancel",
      { bookingId: cleanBookId, cancelReason: reason },
      {
        headers: staffToken ? { Authorization: staffToken.startsWith("Bearer ") ? staffToken : `Bearer ${staffToken}` } : {},
        timeout: 2500,
      }
    );

    // Update local SQLite
    ServingRepository.markBookingCancelledLocally(cleanBookId);

    return {
      ...(res.data?.DATA || res.data || {}),
      message: res.data?.MESSAGE || "Booking cancelled and refunded successfully",
    };
  } catch (err) {
    const msg = err.response?.data?.MESSAGE || err.message || "Failed to cancel booking";
    throw new BadRequestError(msg);
  }
};

/**
 * 5. Lookup Walk-in Customer (for On-Spot Surplus Food)
 */
export const lookupWalkinCustomer = async (queryStr, staffToken) => {
  const clean = (queryStr || "").trim();
  if (!clean) {
    throw new BadRequestError("Customer code or card scan is required");
  }

  // 1. Central Lookup
  try {
    const headers = staffToken ? { Authorization: staffToken.startsWith("Bearer ") ? staffToken : `Bearer ${staffToken}` } : {};
    let customer = null;

    try {
      const empRes = await centralClient.get("/walkin/employee-lookup", {
        params: { query: clean },
        headers,
        timeout: 2000,
      });
      customer = empRes.data?.DATA || empRes.data;
    } catch {
      // Ignore and try visitor lookup
    }

    if (!customer) {
      try {
        const visRes = await centralClient.get("/walkin/visitor-lookup", {
          params: { query: clean },
          headers,
          timeout: 2000,
        });
        customer = visRes.data?.DATA || visRes.data;
      } catch {
        // Ignore
      }
    }

    if (customer) {
      const single = Array.isArray(customer) ? customer[0] : customer;
      if (single) {
        return {
          customerId: single.CUSTOMERID || single.customerId,
          dispName: single.DISPNAME || single.dispName || single.VISNAME || "Customer",
          loginId: single.LOGINID || single.EMPCODE || single.CONTCODE || single.loginId || clean,
          ctypeCode: single.CTYPECODE || single.ctypeCode || "PRM",
          ctypeName: single.CTYPENAME || single.ctypeName || "Employee",
          walletId: single.WALLETID || single.walletId || null,
          walletBalance: Number(single.WALLETBALANCE || single.walletBalance || 0),
          isLiveOnline: true,
        };
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, "Central walkin customer lookup failed; falling back to local SQLite");
  }

  // 2. Offline Fallback
  const cust = ServingRepository.findWalkinCustomerProfile(clean);
  if (!cust) {
    throw new NotFoundError(`Customer "${clean}" not found`);
  }

  return {
    customerId: cust.customer_id,
    dispName: cust.disp_name,
    loginId: cust.login_id,
    ctypeCode: cust.ctype_code,
    ctypeName: cust.ctype_name || "Employee",
    walletBalance: Number(cust.wallet_balance || 0),
    isLiveOnline: false,
  };
};

/**
 * 6. Get Today's Active Slot Menu with Tiered Prices
 */
export const getWalkinMenu = async (canteenId, ctypeCode = "PRM", staffToken) => {
  const effectiveCanteenId = canteenId ? Number(canteenId) : Number(env.CANTEEN_ID || 1);

  try {
    const res = await centralClient.get("/walkin/active-menu", {
      params: { canteenId: effectiveCanteenId, ctypeCode },
      headers: staffToken ? { Authorization: staffToken.startsWith("Bearer ") ? staffToken : `Bearer ${staffToken}` } : {},
      timeout: 2000,
    });

    const items = res.data?.DATA || res.data || [];
    return items.map((it) => ({
      dayMenuId: it.DAYMENUID || it.dayMenuId,
      daySlotId: it.DAYSLOTID || it.daySlotId,
      serviceId: it.SERVICEID || it.serviceId,
      serviceName: it.SERVNAME || it.serviceName || "Meal",
      menuItemId: it.MENUITEMID || it.menuItemId,
      itemName: it.ITEMNAME || it.itemName,
      shortName: it.SHORTNAME || it.shortName,
      price: Number(it.PRICE || it.price || 0),
      isBase: Boolean(it.ISBASE || it.isBase),
      isSpecial: Boolean(it.ISSPECIAL || it.isSpecial),
    }));
  } catch (err) {
    logger.warn({ err: err.message }, "Central walkin menu failed; falling back to local SQLite");

    // Local fallback from cached_menu_items
    const rows = ServingRepository.getWalkinSlotMenuItems();

    return rows.map((it) => ({
      dayMenuId: it.day_menu_id,
      daySlotId: it.day_slot_id,
      serviceId: it.service_id,
      serviceName: it.service_name,
      menuItemId: it.menu_item_id,
      itemName: it.item_name,
      price: ctypeCode === "PRM" ? 0.0 : Number(it.rate || 0),
      isBase: Boolean(it.is_base),
      isSpecial: Boolean(it.is_special),
    }));
  }
};

/**
 * 7. Serve On-Spot Surplus Food (Walk-In)
 */
export const serveWalkinOrder = async (payload, staffToken, staffUserId) => {
  const { customerId, canteenId, serviceId, items } = payload;

  if (!customerId || !serviceId || !items || !items.length) {
    throw new BadRequestError("Customer, Meal Service, and at least 1 food item are required");
  }

  const effectiveCanteenId = canteenId ? Number(canteenId) : Number(env.CANTEEN_ID || 1);

  // 1. Direct Central Call
  try {
    const res = await centralClient.post(
      "/walkin/serve",
      {
        customerId: Number(customerId),
        canteenId: effectiveCanteenId,
        serviceId: Number(serviceId),
        items: items.map((i) => ({
          dayMenuId: Number(i.dayMenuId),
          qty: Number(i.qty || 1),
        })),
      },
      {
        headers: staffToken ? { Authorization: staffToken.startsWith("Bearer ") ? staffToken : `Bearer ${staffToken}` } : {},
        timeout: 3000,
      }
    );

    return {
      ...(res.data?.DATA || res.data || {}),
      isLiveOnline: true,
    };
  } catch (err) {
    logger.warn({ err: err.message }, "Central walkin serve failed; saving to local outbox");

    // 2. Offline Fallback
    const eventUuid = crypto.randomUUID();
    const offlineBookNo = `WI-OFF-${Date.now().toString().slice(-4)}`;

    ServingRepository.queueWalkinOutboxEvent(eventUuid, {
      offlineUuid: eventUuid,
      customerId: Number(customerId),
      canteenId: effectiveCanteenId,
      serviceId: Number(serviceId),
      items,
      staffUserId: staffUserId || 1,
      createdOn: new Date().toISOString(),
    });

    return {
      bookingId: eventUuid,
      bookNo: offlineBookNo,
      statusCode: "SRV",
      statusText: "Served On-Spot (Offline)",
      isLiveOnline: false,
    };
  }
};

/**
 * 8. Active Canteens & Today Slots Discovery
 */
export const getActiveCanteens = async () => {
  try {
    const res = await centralClient.get("/kiosk/canteens", { timeout: 2000 });
    return res.data?.DATA || res.data || [];
  } catch {
    return [
      { CANTEENID: 1, CANTEENNAME: "Canteen A", CANTEENCODE: "CNTA" },
      { CANTEENID: 2, CANTEENNAME: "Canteen B", CANTEENCODE: "CNTB" },
    ];
  }
};

export const getTodaySlots = async (canteenId) => {
  try {
    const res = await centralClient.get("/kiosk/today-slots", {
      params: { canteenId: canteenId || 1 },
      timeout: 2000,
    });
    return res.data?.DATA || res.data || [];
  } catch {
    return [];
  }
};

