import crypto from "crypto";
import * as BookingRepository from "./booking.repository.js";
import * as KioskRepository from "../kiosk/kiosk.repository.js";
import { centralClient } from "../sync/sync.client.js";
import { BadRequestError, NotFoundError } from "../../common/errors/appError.js";
import { env } from "../../config/env.js";
import { PAYMENT_METHOD, WALLET_ELIGIBLE_TYPES } from "../../config/constants.js";
import { getTodayIST } from "../../utils/dateTime.js";
import { logger } from "../../utils/logger.js";

/**
 * Creates next-day pre-booking on local kiosk (Online-First with Offline Fallback)
 */
export const bookNextDay = async (data) => {
  const customerId = Number(data.CUSTOMERID);
  const serviceId = Number(data.SERVICEID);
  const servDate = data.SERVICEDATE;

  // 1. Enforce pre-booking date strictly for tomorrow or future
  const today = getTodayIST();
  if (servDate <= today) {
    throw new BadRequestError(
      "Self-service kiosk bookings are strictly allowed for tomorrow or upcoming days."
    );
  }

  // 2. Validate customer exists in local cache
  const customer = KioskRepository.findCustomerByIdentifier(customerId);
  if (!customer) {
    throw new NotFoundError("Customer profile not found in local cache");
  }

  // 3. Duplicate booking prevention (checks local active bookings and pending outbox)
  const existing = BookingRepository.checkExistingBooking(customerId, serviceId, servDate);
  if (existing) {
    throw new BadRequestError(
      `You already have an active booking (${existing.token_no || existing.book_id || "Recorded"}) for this meal slot.`
    );
  }

  // 4. Resolve dishes and calculate total price
  const formattedItems = [];
  let totalAmount = 0.0;

  for (const rawItem of data.ITEMS || []) {
    const dayMenuId = Number(rawItem.dayMenuId || rawItem.DAYMENUID);
    const menuItemId = Number(rawItem.menuItemId || rawItem.MENUITEMID);
    const qty = Number(rawItem.qty || rawItem.QTY || 1);

    if (qty < 1) continue;

    // Retrieve price from local cache
    const menuDb = KioskRepository.getNextDayMenuItems(servDate, serviceId);
    const dish = menuDb.find((m) => m.day_menu_id === dayMenuId || m.menu_item_id === menuItemId);

    const rate = dish ? Number(dish.rate || 0) : 0.0;
    const itemTotal = rate * qty;
    totalAmount += itemTotal;

    formattedItems.push({
      dayMenuId,
      menuItemId: dish ? dish.menu_item_id : menuItemId,
      itemName: dish ? dish.item_name : "Meal Item",
      qty,
      rate,
      amount: itemTotal,
    });
  }

  if (formattedItems.length === 0) {
    throw new BadRequestError("No valid dishes selected for booking");
  }

  // 5. Check wallet balance if contract worker or visitor
  const isWalletEligible = WALLET_ELIGIBLE_TYPES.includes(customer.ctype_code);
  const paymentMethod = isWalletEligible ? PAYMENT_METHOD.WALLET : PAYMENT_METHOD.OFFICIAL;

  if (isWalletEligible && totalAmount > 0) {
    const wallet = KioskRepository.getCustomerWallet(customerId);
    const currentBal = wallet ? Number(wallet.balance) : 0.0;

    if (currentBal < totalAmount) {
      throw new BadRequestError(
        `Insufficient wallet balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${currentBal.toFixed(2)}. Please top up.`
      );
    }
  }

  // 6. Pre-generate offlineUuid upfront for idempotency across online and offline paths
  const offlineUuid = crypto.randomUUID();

  // 7. ONLINE DIRECT ATTEMPT: Intranet direct call with strict 2.0s timeout
  const centralPayload = {
    CUSTOMERID: customerId,
    SERVICEID: serviceId,
    SERVICEDATE: servDate,
    ITEMS: formattedItems.map((it) => ({
      DAYMENUID: it.dayMenuId,
      MENUITEMID: it.menuItemId,
      QTY: it.qty,
    })),
    OFFLINEUUID: offlineUuid,
    KIOSKCODE: env.KIOSK_CODE,
    CANTEENID: env.CANTEEN_ID,
  };

  try {
    const res = await centralClient.post("/kiosk/self-service/book", centralPayload, {
      timeout: 2000, // 2.0s Intranet Timeout
    });

    const confirmed = res.data?.DATA || res.data;

    // Direct cache into SQLite (no outbox record created)
    BookingRepository.cacheConfirmedPreBooking({
      customerId,
      serviceId,
      servDate,
      bookId: confirmed.bookId,
      tokenNo: confirmed.bookNo,
    });

    // Update local wallet balance view if live balance returned
    if (confirmed.walletBalance != null) {
      KioskRepository.updateWalletBalance(customerId, confirmed.walletBalance);
    }

    logger.info(
      { customerId, serviceId, servDate, bookId: confirmed.bookId, bookNo: confirmed.bookNo },
      "Direct central booking confirmed successfully"
    );

    return {
      bookingId: confirmed.bookId,
      bookNo: confirmed.bookNo,
      customerId,
      serviceId,
      serviceDate: servDate,
      totalAmount: confirmed.totalAmount != null ? confirmed.totalAmount : totalAmount,
      walletBalance: confirmed.walletBalance != null ? confirmed.walletBalance : undefined,
      isOfflineRecord: false,
      disclaimer: null,
    };
  } catch (error) {
    // If central server rejected with 4xx business error (duplicate booking, invalid items, etc.), propagate to user
    const statusCode = error.response?.status;
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      const serverMsg = error.response?.data?.MESSAGE || error.response?.data?.message;
      throw new BadRequestError(serverMsg || "Booking could not be processed by central server");
    }

    logger.warn(
      { err: error.message, customerId, serviceId, servDate },
      "Direct central booking timed out or offline; falling back to SQLite Outbox"
    );

    // 8. OFFLINE FALLBACK PATH: Network disconnect, PM2 restart, or timeout
    const saved = BookingRepository.saveOfflinePreBooking({
      offlineUuid, // Maintain the same UUID for idempotency
      kioskCode: env.KIOSK_CODE,
      customerId,
      serviceId,
      servDate,
      items: formattedItems,
      totalAmount,
      paymentMethod,
      isWalletEligible,
    });

    return {
      bookingId: saved.offlineUuid,
      offlineUuid: saved.offlineUuid,
      bookNo: null,
      customerId,
      serviceId,
      serviceDate: servDate,
      totalAmount,
      paymentMethod,
      isOfflineRecord: true,
      disclaimer:
        "Saved locally on kiosk. Confirmed upon automatic server synchronization.",
    };
  }
};

/**
 * Cancels a pre-booking (handles both offline outbox records and online central bookings)
 */
export const cancelBooking = async (data) => {
  const bookingId = String(data.BOOKINGID || data.bookingId);
  const customerId = Number(data.CUSTOMERID || data.customerId);

  // 1. First attempt to cancel a locally queued outbox record
  const cancelledLocal = BookingRepository.cancelOfflinePreBooking(bookingId, customerId);
  if (cancelledLocal) {
    return {
      bookingId,
      cancelled: true,
      isOfflineRecord: true,
      message: "Offline booking cancelled successfully",
    };
  }

  // 2. If not found in local outbox, attempt central cancellation for online/synced booking
  try {
    const res = await centralClient.post(
      "/kiosk/self-service/cancel",
      {
        BOOKINGID: isNaN(Number(bookingId)) ? bookingId : Number(bookingId),
        CUSTOMERID: customerId,
        CANCELREASON: `Cancelled by Employee at Kiosk [${env.KIOSK_CODE}]`,
      },
      { timeout: 2500 }
    );

    // Clean up local cache if present
    BookingRepository.removeCachedActivePreBooking(customerId, bookingId);

    // If live updated wallet balance is returned, update local cache
    const resData = res.data?.DATA || res.data;
    if (resData?.walletBalance != null) {
      KioskRepository.updateWalletBalance(customerId, resData.walletBalance);
    }

    return {
      bookingId,
      cancelled: true,
      isOfflineRecord: false,
      message: res.data?.MESSAGE || "Booking cancelled and refunded successfully",
    };
  } catch (err) {
    const errMsg =
      err.response?.data?.MESSAGE ||
      err.response?.data?.message ||
      err.message ||
      "Booking could not be cancelled centrally (kiosk may be offline or booking is already served/cut-off).";
    throw new BadRequestError(errMsg);
  }
};
