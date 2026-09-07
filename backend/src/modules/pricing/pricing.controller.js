import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import {
  createItemPrice,
  deactivateItemPrice,
  fetchEffectiveItemPrice,
  fetchEffectiveItemPrices,
  fetchItemPriceHistory,
} from "./pricing.service.js";

export const createItemPriceController = asyncHandler(async (req, res) => {
  const data = await createItemPrice(
    req.validated.params.menuItemId,
    req.validated.body,
    req.user.USERID
  );

  return sendSuccess(res, data, "Item price created successfully", 201);
});

export const getItemPriceHistoryController = asyncHandler(async (req, res) => {
  const data = await fetchItemPriceHistory(req.validated.params.menuItemId);
  return sendSuccess(res, data, "Item price history fetched successfully");
});

export const getEffectiveItemPricesController = asyncHandler(async (req, res) => {
  const data = await fetchEffectiveItemPrices(
    req.validated.params.menuItemId,
    req.validated.query.serviceDate
  );
  return sendSuccess(res, data, "Effective item prices fetched successfully");
});

export const getEffectiveItemPriceController = asyncHandler(async (req, res) => {
  const data = await fetchEffectiveItemPrice(
    req.validated.params.menuItemId,
    req.validated.params.customerTypeCode,
    req.validated.query.serviceDate
  );
  return sendSuccess(res, data, "Effective item price fetched successfully");
});

export const deactivateItemPriceController = asyncHandler(async (req, res) => {
  const data = await deactivateItemPrice(req.validated.params.itemPriceId);
  return sendSuccess(res, data, "Item price deactivated successfully");
});
