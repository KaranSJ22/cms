import { sendSuccess } from "../../utils/apiResponse.js";
import * as ReportService from "./report.service.js";

export const getKitchenSummary = async (req, res, next) => {
  try {
    const daySlotId = parseInt(req.query.daySlotId, 10);
    const result = await ReportService.getKitchenSummary(daySlotId);
    sendSuccess(res, result, "Kitchen summary retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};
