import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as ReportController from "./report.controller.js";
import * as validation from "./report.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/kitchen-summary",
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(validation.getKitchenSummarySchema),
  ReportController.getKitchenSummary
);

router.get(
  "/monthly-payroll",
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(validation.getMonthlyPayrollSchema),
  ReportController.getMonthlyPayrollReport
);

router.get(
  "/monthly-payroll/:customerId",
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(validation.getEmployeePayrollBreakdownSchema),
  ReportController.getEmployeeMonthlyPayrollBreakdown
);

export default router;
