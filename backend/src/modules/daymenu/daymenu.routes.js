import express from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeCanteenRoles, getResourceCanteenId, authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  daySlotParamSchema,
  replaceDayMenuSchema,
  approveDayMenuSchema,
  publishedMenuSchema,
  bulkCreateDayMenuSchema,
} from "./daymenu.validation.js";

import {
  getDayMenuWorkspaceController,
  updateMenuItemsController,
  submitDayMenuController,
  approveDayMenuController,
  rejectDayMenuController,
  getPendingDayMenusController,
  viewPublishedMenuController,
  bulkCreateDayMenuController,
} from "./daymenu.controller.js";

const router = express.Router();

const getCanteenFromDaySlot = async (req) => getResourceCanteenId("DAYSLOT", req.params.daySlotId || req.params.id);

// POST /day-menus/bulk
// Defined before param routes to prevent param collisions
router.post(
  "/bulk",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(bulkCreateDayMenuSchema),
  bulkCreateDayMenuController
);

// GET /day-menus/pending
router.get(
  "/pending",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR"),
  getPendingDayMenusController
);

// GET /day-menus/published
router.get(
  "/published",
  authenticate,
  validate(publishedMenuSchema),
  viewPublishedMenuController
);

// GET /day-menus/slots/:daySlotId
router.get(
  "/slots/:daySlotId",
  authenticate,
  authorizeCanteenRoles(["CNTMGR", "CNTAST"], getCanteenFromDaySlot),
  validate(daySlotParamSchema),
  getDayMenuWorkspaceController
);

// PUT /day-menus/slots/:daySlotId
router.put(
  "/slots/:daySlotId",
  authenticate,
  authorizeCanteenRoles(["CNTMGR", "CNTAST"], getCanteenFromDaySlot),
  validate(replaceDayMenuSchema),
  updateMenuItemsController
);

// POST /day-menus/slots/:daySlotId/submit
router.post(
  "/slots/:daySlotId/submit",
  authenticate,
  authorizeCanteenRoles(["CNTMGR", "CNTAST"], getCanteenFromDaySlot),
  validate(daySlotParamSchema),
  submitDayMenuController
);

// POST /day-menus/slots/:daySlotId/approve
router.post(
  "/slots/:daySlotId/approve",
  authenticate,
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromDaySlot),
  validate(approveDayMenuSchema),
  approveDayMenuController
);

// POST /day-menus/slots/:daySlotId/reject
router.post(
  "/slots/:daySlotId/reject",
  authenticate,
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromDaySlot),
  validate(approveDayMenuSchema),
  rejectDayMenuController
);

export default router;
