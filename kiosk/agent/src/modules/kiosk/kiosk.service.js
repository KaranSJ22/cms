import * as KioskRepository from "./kiosk.repository.js";
import { centralClient } from "../sync/sync.client.js";
import { NotFoundError } from "../../common/errors/appError.js";
import { WALLET_ELIGIBLE_TYPES } from "../../config/constants.js";
import { getTodayIST, getTomorrowIST } from "../../utils/dateTime.js";
import { logger } from "../../utils/logger.js";

/**
 * Resolves employee profile from local SQLite cache
 */
export const getLocalEmployeeProfile = (identifier) => {
  const customer = KioskRepository.findCustomerByIdentifier(identifier);
  if (!customer) {
    throw new NotFoundError(
      `Employee or visitor with badge "${identifier}" was not found in the local kiosk cache.`
    );
  }

  const isWalletEligible = WALLET_ELIGIBLE_TYPES.includes(customer.ctype_code);
  let wallet = null;

  if (isWalletEligible) {
    const cachedWallet = KioskRepository.getCustomerWallet(customer.customer_id);
    wallet = {
      balance: cachedWallet ? Number(cachedWallet.balance) : 0.0,
      statusId: cachedWallet ? cachedWallet.status_id : 10,
    };
  }

  const today = getTodayIST();
  const { cachedRows, outboxRows } = KioskRepository.getCustomerActiveBookings(
    customer.customer_id,
    today
  );

  // Normalize upcoming bookings for React UI
  const upcomingBookings = [
    ...outboxRows.map((r) => ({
      bookId: r.offline_uuid,
      bookNo: r.token_no,
      serviceId: r.service_id,
      serviceName: r.service_name,
      serviceDate: r.serv_date,
      totalAmount: r.total_amount,
      syncStatus: r.sync_status,
      isLocalOutbox: true,
    })),
    ...cachedRows.map((r) => ({
      bookId: r.book_id || r.token_no,
      bookNo: r.token_no,
      serviceId: r.service_id,
      serviceName: r.service_name,
      serviceDate: r.serv_date,
      isLocalOutbox: false,
    })),
  ];

  // Retrieve recent declined bookings to alert employee
  const declinedRows = KioskRepository.getRecentDeclinedBookings(
    customer.customer_id,
    today
  );

  const declinedBookings = declinedRows.map((r) => ({
    bookId: r.offline_uuid,
    serviceId: r.service_id,
    serviceName: r.service_name || "Meal Service",
    serviceDate: r.serv_date,
    totalAmount: r.total_amount,
    syncError: r.sync_error || "Declined by central server",
    createdAt: r.created_at,
  }));

  return {
    customer: {
      customerId: customer.customer_id,
      displayName: customer.disp_name,
      customerTypeCode: customer.ctype_code,
      customerTypeName: customer.ctype_name || "Employee",
      loginId: customer.login_id || String(customer.customer_id),
      rfidUid: customer.rfid_uid || null,
      isWalletEligible,
    },
    wallet,
    upcomingBookings,
    declinedBookings,
    isLiveOnline: false,
  };
};

/**
 * Scan RFID / Employee ID at local Kiosk (Direct-First with Local Cache Fallback)
 */
export const scanEmployee = async (identifier) => {
  // 1. Direct Central Scan (1.5s Intranet Timeout)
  try {
    const res = await centralClient.post(
      "/kiosk/self-service/scan",
      { PIDENTIFIER: identifier },
      { timeout: 1500 }
    );
    const liveData = res.data?.DATA || res.data;

    if (liveData && liveData.customer) {
      // Opportunistically update local SQLite cache with live central data
      try {
        KioskRepository.upsertCustomerCache(liveData.customer);
        if (liveData.wallet) {
          KioskRepository.upsertWalletCache(liveData.customer.customerId, liveData.wallet);
        }
      } catch (cacheErr) {
        logger.warn({ err: cacheErr.message }, "Failed to update local cache from live scan");
      }

      // Check if there are any locally queued outbox bookings still pending sync
      const today = getTodayIST();
      const { outboxRows } = KioskRepository.getCustomerActiveBookings(
        liveData.customer.customerId,
        today
      );

      const pendingOutbox = outboxRows.map((r) => ({
        bookId: r.offline_uuid,
        bookNo: r.token_no,
        serviceId: r.service_id,
        serviceName: r.service_name,
        serviceDate: r.serv_date,
        totalAmount: r.total_amount,
        syncStatus: r.sync_status,
        isLocalOutbox: true,
      }));

      // Merge local outbox records with confirmed central bookings (only active CRT bookings)
      const combinedBookings = [
        ...pendingOutbox,
        ...(liveData.upcomingBookings || [])
          .filter((b) => (b.STATUSCODE || b.statusCode || "CRT") === "CRT")
          .map((b) => ({
            bookId: b.BOOKID || b.bookId,
            bookNo: b.BOOKNO || b.bookNo,
            serviceId: b.SERVICEID || b.serviceId,
            serviceName: b.SERVNAME || b.serviceName,
            serviceDate: b.SERVICEDATE ? String(b.SERVICEDATE).slice(0, 10) : b.serviceDate,
            totalAmount: b.TOTALAMOUNT != null ? Number(b.TOTALAMOUNT) : b.totalAmount,
            statusCode: b.STATUSCODE || b.statusCode || "CRT",
            isLocalOutbox: false,
          })),
      ];

      return {
        customer: liveData.customer,
        wallet: liveData.wallet,
        upcomingBookings: combinedBookings,
        declinedBookings: liveData.declinedBookings || [],
        isLiveOnline: true,
      };
    }
  } catch (netErr) {
    // If the central server responded with a 404 (user not found), propagate it
    if (netErr.response?.status === 404) {
      throw new NotFoundError(
        netErr.response?.data?.MESSAGE || `Employee with badge "${identifier}" was not found.`
      );
    }
    logger.warn({ err: netErr.message }, "Central scan timed out or offline; reading SQLite cache");
  }

  // 2. Offline Fallback: Read from local SQLite cache
  return getLocalEmployeeProfile(identifier);
};

/**
 * Returns tomorrow's available meal services
 */
export const getNextDayServices = () => {
  const tomorrow = getTomorrowIST();
  const rows = KioskRepository.getNextDaySlots(tomorrow);

  return {
    targetDate: tomorrow,
    services: rows.map((r) => ({
      serviceId: r.service_id,
      serviceName: r.service_name,
      startTime: r.start_time,
      endTime: r.end_time,
      totalItems: Number(r.total_items || 0),
    })),
  };
};

/**
 * Returns tomorrow's menu grouped by service
 */
export const getNextDayMenu = (serviceId = null) => {
  const tomorrow = getTomorrowIST();
  const items = KioskRepository.getNextDayMenuItems(tomorrow, serviceId);

  const serviceMap = new Map();
  for (const item of items) {
    if (!serviceMap.has(item.service_id)) {
      serviceMap.set(item.service_id, {
        serviceId: item.service_id,
        serviceName: item.service_name,
        startTime: item.start_time,
        endTime: item.end_time,
        serviceDate: tomorrow,
        items: [],
      });
    }

    serviceMap.get(item.service_id).items.push({
      dayMenuId: item.day_menu_id,
      daySlotId: item.day_slot_id,
      menuItemId: item.menu_item_id,
      itemName: item.item_name,
      rate: Number(item.rate || 0),
      isBase: Boolean(item.is_base),
      isSpecial: Boolean(item.is_special),
      maxQty: item.max_qty || 1,
      bookUntil: item.book_until,
    });
  }

  return {
    targetDate: tomorrow,
    services: Array.from(serviceMap.values()),
  };
};
