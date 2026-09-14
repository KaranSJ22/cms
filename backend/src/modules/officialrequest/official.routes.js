import express from "express";
import { pool } from "../../db/connection.js";
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
} from "./official.validation.js";

import {
  listServicesController,
  getServiceDetailsController,
  createServiceController,
  updateServiceController,
  createComboController,
  updateComboController,
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
} from "./official.controller.js";

const router = express.Router();

// Canteen resolution helpers for routes keyed by child entity ID
const getCanteenFromService = async (req) => {
  const serviceId = Number(req.params.id);
  if (!serviceId) return null;
  const [rows] = await pool.query(
    "SELECT CANTEENID FROM CMS_OFFSERV WHERE OFFSERVID = ?",
    [serviceId]
  );
  return rows[0]?.CANTEENID;
};

const getCanteenFromServiceBody = async (req) => {
  const serviceId = Number(req.body?.OFFSERVID || req.validated?.body?.OFFSERVID);
  if (!serviceId) return null;
  const [rows] = await pool.query(
    "SELECT CANTEENID FROM CMS_OFFSERV WHERE OFFSERVID = ?",
    [serviceId]
  );
  return rows[0]?.CANTEENID;
};

const getCanteenFromCombo = async (req) => {
  const comboId = Number(req.params.id);
  if (!comboId) return null;
  const [rows] = await pool.query(
    "SELECT os.CANTEENID FROM CMS_OFFCOMBO oc JOIN CMS_OFFSERV os ON os.OFFSERVID = oc.OFFSERVID WHERE oc.OFFCOMBOID = ?",
    [comboId]
  );
  return rows[0]?.CANTEENID;
};

const getCanteenFromBooking = async (req) => {
  const bookingId = Number(req.params.id);
  if (!bookingId) return null;
  const [rows] = await pool.query(
    "SELECT CANTEENID FROM CMS_OFFBOOK WHERE OFFBOOKID = ?",
    [bookingId]
  );
  return rows[0]?.CANTEENID;
};

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

export default router;
