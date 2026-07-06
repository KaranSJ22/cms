import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

import {
  createMenu,
  updateMenu,
  fetchMenus,
  fetchMenu,
} from "./menu.service.js";

export const getMenusController = asyncHandler(async (req, res) => {
  const data = await fetchMenus();
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
