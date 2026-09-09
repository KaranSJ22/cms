import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as ReportController from "./report.controller.js";
import * as validation from "./report.validation.js";

const router = Router();

router.use(authenticate);

// Authorization middleware for Manager / Admin report access
const authorizeReportAccess = (req, res, next) => {
  const isSysAdmin = (req.user?.SYSTEMROLES || []).includes("SYSADM");
  const isCanteenRole = (req.user?.CANTEENROLES || []).some((r) =>
    ["CNTMGR", "CNTAST"].includes(r.ROLECODE)
  );

  if (!isSysAdmin && !isCanteenRole) {
    return res.status(403).json({
      SUCCESS: false,
      MESSAGE: "Access Denied: You do not have permission to access operational reports",
    });
  }
  next();
};

router.get(
  "/kitchen-summary",
  authorizeReportAccess,
  validate(validation.getKitchenSummarySchema),
  ReportController.getKitchenSummary
);

router.get(
  "/monthly-payroll",
  authorizeReportAccess,
  validate(validation.getMonthlyPayrollSchema),
  ReportController.getMonthlyPayrollReport
);

router.get(
  "/monthly-payroll/:customerId",
  authorizeReportAccess,
  validate(validation.getEmployeePayrollBreakdownSchema),
  ReportController.getEmployeeMonthlyPayrollBreakdown
);

export default router;
