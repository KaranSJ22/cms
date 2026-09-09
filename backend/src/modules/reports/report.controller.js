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

export const getMonthlyPayrollReport = async (req, res, next) => {
  try {
    const filters = req.validated?.query || req.query;
    const result = await ReportService.getMonthlyPayrollReport(filters);
    sendSuccess(res, result, "Monthly payroll report retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeMonthlyPayrollBreakdown = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    const { month, year } = req.validated?.query || req.query;
    const result = await ReportService.getEmployeeMonthlyPayrollBreakdown({
      customerId: parseInt(customerId, 10),
      month,
      year,
    });
    sendSuccess(res, result, "Employee payroll breakdown retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};
