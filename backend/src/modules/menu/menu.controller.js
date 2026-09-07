import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

import {
  createMenu,
  updateMenu,
  fetchMenus,
  fetchMenu,
  checkPriceReadiness,
} from "./menu.service.js";

export const getMenusController = asyncHandler(async (req, res) => {
  const data = await fetchMenus(req.query.isSpecial, req.query.status);
  return sendSuccess(res, data, "Menu items fetched successfully");
});

export const getMenuController = asyncHandler(async (req, res) => {
  const data = await fetchMenu(req.validated.params.id);
  return sendSuccess(res, data, "Menu item fetched successfully");
});

export const createMenuController = asyncHandler(async (req, res) => {
  const data = await createMenu(req.validated.body, req.user.USERID);
  return sendSuccess(res, data, "Menu item created successfully", 201);
});

export const updateMenuController = asyncHandler(async (req, res) => {
  const data = await updateMenu(
    req.validated.params.id,
    req.validated.body,
    req.user.USERID
  );

  return sendSuccess(res, data, "Menu item updated successfully");
});

export const checkPriceReadinessController = asyncHandler(async (req, res) => {
  try {
    const data = await checkPriceReadiness(
      req.validated.params.id,
      req.validated.query.serviceDate
    );
    return sendSuccess(res, data, "Price readiness checked successfully");
  } catch (error) {
    if (error.message && error.message.includes("missing")) {
      return res.status(400).json({
        SUCCESS: false,
        MESSAGE: error.message,
      });
    }
    throw error;
  }
});
