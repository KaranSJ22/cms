import { Router } from "express";
import { authorizeRoles as authorize } from "../../middlwares/role.middleware.js";
import { authenticate } from "../../middlwares/auth.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
import * as ReportController from "./report.controller.js";
import * as validation from "./report.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/kitchen-summary",
  authorize(["SYSADM", "CMGR", "CAST"]),
  validate(validation.getKitchenSummarySchema),
  ReportController.getKitchenSummary
);

export default router;
