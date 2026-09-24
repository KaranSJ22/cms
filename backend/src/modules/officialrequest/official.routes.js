import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  authorizeSystemRoles,
  authorizeCanteenRoles,
} from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  idParamSchema,
  listServicesQuerySchema,
  createServiceSchema,
  updateServiceSchema,
  createComboSchema,
  updateComboSchema,
  createBookingSchema,
  resubmitBookingSchema,
  approverActionSchema,
  managerActionSchema,
  levelMappingSchema,
  kitchenConfirmedQuerySchema,
  kitchenPrepSummaryQuerySchema,
} from "./official.validation.js";

import {
  getCanteenIdByServiceId,
  getCanteenIdByComboId,
  getCanteenIdByBookingId,
} from "./official.service.js";

import {
  listServicesController,
  getServiceDetailsController,
  createServiceController,
  updateServiceController,
  createComboController,
  updateComboController,
  deleteComboController,
  listAvailableMenuItemsController,
  listLevelMappingsController,
  upsertLevelMappingController,
  getEligibleApproversController,
  createBookingController,
  getBookingDetailsController,
  listMyBookingsController,
  resubmitBookingController,
  listAssignedApprovalsController,
  processApproverActionController,
  listManagerPendingBookingsController,
  processManagerActionController,
  listConfirmedOfficialBookingsController,
  getOfficialKitchenPrepSummaryController,
} from "./official.controller.js";

const router = express.Router();

// Canteen resolution helpers for routes keyed by child entity ID
const getCanteenFromService = (req) =>
  getCanteenIdByServiceId(req.params.id);

const getCanteenFromServiceBody = (req) =>
  getCanteenIdByServiceId(req.body?.OFFSERVID || req.validated?.body?.OFFSERVID);

const getCanteenFromCombo = (req) =>
  getCanteenIdByComboId(req.params.id);

const getCanteenFromBooking = (req) =>
  getCanteenIdByBookingId(req.params.id);


// ============================================================
// 1. Services & Combos (Canteen Manager)
// ============================================================
router.get(
  "/services",
  authenticate,
  validate(listServicesQuerySchema),
  listServicesController
);

router.get(
  "/services/menu-items",
  authenticate,
  listAvailableMenuItemsController
);

router.get(
  "/services/:id",
  authenticate,
  validate(idParamSchema),
  getServiceDetailsController
);

router.post(
  "/services",
  authenticate,
  validate(createServiceSchema),
  authorizeCanteenRoles(["CNTMGR"]),
  createServiceController
);

router.put(
  "/services/:id",
  authenticate,
  validate(updateServiceSchema),
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromService),
  updateServiceController
);

router.post(
  "/combos",
  authenticate,
  validate(createComboSchema),
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromServiceBody),
  createComboController
);

router.put(
  "/combos/:id",
  authenticate,
  validate(updateComboSchema),
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromCombo),
  updateComboController
);

router.delete(
  "/combos/:id",
  authenticate,
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromCombo),
  deleteComboController
);

// ============================================================
// 2. Level Mappings & Approvers
// ============================================================
router.get(
  "/level-mappings",
  authenticate,
  listLevelMappingsController
);

router.post(
  "/level-mappings",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(levelMappingSchema),
  upsertLevelMappingController
);

router.get(
  "/approvers",
  authenticate,
  getEligibleApproversController
);

// ============================================================
// 3. Official Bookings Lifecycle (Employee)
// ============================================================
router.post(
  "/bookings",
  authenticate,
  validate(createBookingSchema),
  createBookingController
);

router.get(
  "/bookings/my",
  authenticate,
  listMyBookingsController
);

router.get(
  "/bookings/:id",
  authenticate,
  validate(idParamSchema),
  getBookingDetailsController
);

router.put(
  "/bookings/:id/resubmit",
  authenticate,
  validate(resubmitBookingSchema),
  resubmitBookingController
);

// ============================================================
// 4. Approver Workflow
// ============================================================
router.get(
  "/approvals/assigned",
  authenticate,
  listAssignedApprovalsController
);

router.post(
  "/approvals/:id/action",
  authenticate,
  validate(approverActionSchema),
  processApproverActionController
);

// ============================================================
// 5. Canteen Manager Workflow
// ============================================================
router.get(
  "/manager/pending",
  authenticate,
  authorizeCanteenRoles(["CNTMGR"]),
  listManagerPendingBookingsController
);

router.post(
  "/manager/:id/action",
  authenticate,
  validate(managerActionSchema),
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromBooking),
  processManagerActionController
);

// ============================================================
// 6. Kitchen Preparation & Fulfillment Workflow (Staff, Assistants & Managers)
// ============================================================
router.get(
  "/kitchen-prep/confirmed",
  authenticate,
  authorizeCanteenRoles(["CNTMGR", "CNTAST", "CNTSTF"]),
  validate(kitchenConfirmedQuerySchema),
  listConfirmedOfficialBookingsController
);

router.get(
  "/kitchen-prep/summary",
  authenticate,
  authorizeCanteenRoles(["CNTMGR", "CNTAST", "CNTSTF"]),
  validate(kitchenPrepSummaryQuerySchema),
  getOfficialKitchenPrepSummaryController
);

export default router;
