import * as BookingRepository from "./booking.repository.js";
import * as KioskRepository from "../kiosk/kiosk.repository.js";
import { BadRequestError, NotFoundError } from "../../common/errors/appError.js";
import { env } from "../../config/env.js";
import { PAYMENT_METHOD, WALLET_ELIGIBLE_TYPES } from "../../config/constants.js";
import { getTodayIST } from "../../utils/dateTime.js";

/**
 * Creates next-day pre-booking on local kiosk
 */
export const bookNextDay = (data) => {
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

  // 2. Validate customer exists
  const customer = KioskRepository.findCustomerByIdentifier(customerId);
  if (!customer) {
    throw new NotFoundError("Customer profile not found in local cache");
  }

  // 3. Duplicate booking prevention
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

  // 6. Atomically save to local SQLite outbox
  const saved = BookingRepository.saveOfflinePreBooking({
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
      "Saved locally on kiosk. Booking confirmed upon automatic server synchronization.",
  };
};

/**
 * Cancels a locally recorded pre-booking
 */
export const cancelBooking = (data) => {
  const bookingId = String(data.BOOKINGID);
  const customerId = Number(data.CUSTOMERID);

  const cancelled = BookingRepository.cancelOfflinePreBooking(bookingId, customerId);
  if (!cancelled) {
    throw new NotFoundError(
      "Booking could not be cancelled locally (may already be synced or belongs to another user)."
    );
  }

  return {
    bookingId,
    cancelled: true,
    message: "Booking cancelled successfully",
  };
};
