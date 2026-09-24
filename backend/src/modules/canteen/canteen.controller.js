import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { getCanteens as getCanteensService } from "./canteen.service.js";

export const getCanteens = asyncHandler(async (req, res) => {
  const centerId = req.query.CENTERID || req.query.centerId || null;
  const canteens = await getCanteensService({
    CENTERID: centerId ? Number(centerId) : null,
  });

  return sendSuccess(res, canteens, "Canteens retrieved successfully");
});

