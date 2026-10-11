import * as KioskRepository from "./kiosk.repository.js";
import { NotFoundError } from "../../common/errors/appError.js";
import { WALLET_ELIGIBLE_TYPES } from "../../config/constants.js";
import { getTodayIST, getTomorrowIST } from "../../utils/dateTime.js";

/**
 * Scan RFID / Employee ID at local Kiosk
 */
export const scanEmployee = (identifier) => {
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
  };
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
