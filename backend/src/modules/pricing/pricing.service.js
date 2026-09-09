import {
  addItemPrice as addItemPriceRepository,
  deactivateItemPrice as deactivateItemPriceRepository,
  getEffectiveItemPrice,
  getEffectiveItemPrices,
  getItemPriceHistory,
} from "./pricing.repository.js";
import { NotFoundError, DatabaseError } from "../../common/errors/appError.js";

export const createItemPrice = async (menuItemId, priceData, createdByUserId) => {
  const created = await addItemPriceRepository({
    MENUITEMID: menuItemId,
    EFFFROM: priceData.EFFFROM,
    PRICEJSON: priceData.PRICES,
    CREATEDBY: createdByUserId,
  });

  if (!created?.ITEMPRICEID) {
    throw new DatabaseError("Item price creation failed");
  }

  return created;
};

export const fetchItemPriceHistory = async (menuItemId) =>
  getItemPriceHistory(menuItemId);

export const fetchEffectiveItemPrices = async (menuItemId, serviceDate) =>
  getEffectiveItemPrices(menuItemId, serviceDate);

export const fetchEffectiveItemPrice = async (
  menuItemId,
  customerTypeCode,
  serviceDate
) => {
  const price = await getEffectiveItemPrice(
    menuItemId,
    customerTypeCode,
    serviceDate
  );

  if (!price) {
    throw new NotFoundError("No effective price found for this customer type");
  }

  return price;
};

export const deactivateItemPrice = async (itemPriceId) => {
  const result = await deactivateItemPriceRepository(itemPriceId);

  if (!result?.ITEMPRICEID) {
    throw new DatabaseError("Item price deactivation failed");
  }

  return result;
};

