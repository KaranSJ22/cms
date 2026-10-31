import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { loginUser, ssoLoginUser, rfidLoginUser } from "./auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.validated.body);

  return sendSuccess(res, data, "Login successful", 200);
});

export const ssoLogin = asyncHandler(async (req, res) => {
  const data = await ssoLoginUser(req.validated.body);

  return sendSuccess(res, data, "SSO Login successful", 200);
});

export const rfidLogin = asyncHandler(async (req, res) => {
  const data = await rfidLoginUser(req.validated.body);

  return sendSuccess(res, data, "RFID Login successful", 200);
});