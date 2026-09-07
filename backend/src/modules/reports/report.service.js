import * as ReportRepository from "./report.repository.js";
import { NotFoundError } from "../../common/errors/appError.js";

export const getKitchenSummary = async (daySlotId) => {
  const result = await ReportRepository.getKitchenSummary(daySlotId);
  return result;
};
