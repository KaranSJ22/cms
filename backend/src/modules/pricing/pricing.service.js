import {
  addItemPrice as addItemPriceRepository,
  deactivateItemPrice as deactivateItemPriceRepository,
  getEffectiveItemPrice,
  getEffectiveItemPrices,
  getItemPriceHistory,
} from "./pricing.repository.js";

export const createItemPrice = async (menuItemId, priceData, createdByUserId) => {
  const created = await addItemPriceRepository({
    MENUITEMID: menuItemId,
    EFFFROM: priceData.EFFFROM,
    PRICEJSON: priceData.PRICES,
    CREATEDBY: createdByUserId,
  });

  if (!created?.ITEMPRICEID) {
    const error = new Error("Item price creation failed");
    error.statusCode = 500;
    throw error;
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
    const error = new Error("No effective price found for this customer type");
    error.statusCode = 404;
    throw error;
  }

  return price;
};

export const deactivateItemPrice = async (itemPriceId) => {
  const result = await deactivateItemPriceRepository(itemPriceId);

  if (!result?.ITEMPRICEID) {
    const error = new Error("Item price deactivation failed");
    error.statusCode = 500;
    throw error;
  }

  return result;
};
