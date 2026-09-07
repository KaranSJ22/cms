import express from "express";

import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeCanteenRoles, getResourceCanteenId, authorizeAnyCanteenRole } from "../../middlwares/role.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
import {
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

const getCanteenFromDaySlot = async (req) => getResourceCanteenId('DAYSLOT', req.params.id);

// POST /day-menus/bulk
// IMPORTANT: This literal route must be defined BEFORE /:id/* param routes
// to prevent the router from matching 'bulk' as an ID parameter.
router.post(
  "/bulk",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(bulkCreateDayMenuSchema),
  bulkCreateDayMenuController
);

// GET /day-slots/:id/menu
router.get(
  "/:id/menu",
  authenticate,
  authorizeCanteenRoles(["CNTMGR", "CNTAST"], getCanteenFromDaySlot),
  getDayMenuWorkspaceController
);

// PUT /day-slots/:id/menu
router.put(
  "/:id/menu",
  authenticate,
  authorizeCanteenRoles(["CNTMGR", "CNTAST"], getCanteenFromDaySlot),
  validate(replaceDayMenuSchema),
  updateMenuItemsController
);

// POST /day-slots/:id/menu/submit
router.post(
  "/:id/menu/submit",
  authenticate,
  authorizeCanteenRoles(["CNTMGR", "CNTAST"], getCanteenFromDaySlot),
  submitDayMenuController
);

// POST /day-slots/:id/menu/approve
router.post(
  "/:id/menu/approve",
  authenticate,
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromDaySlot),
  validate(approveDayMenuSchema),
  approveDayMenuController
);

// POST /day-slots/:id/menu/reject
router.post(
  "/:id/menu/reject",
  authenticate,
  authorizeCanteenRoles(["CNTMGR"], getCanteenFromDaySlot),
  validate(approveDayMenuSchema),
  rejectDayMenuController
);

// GET /day-menus/pending
router.get(
  "/pending",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR"),
  getPendingDayMenusController
);

export const publishedMenuRoutes = express.Router();

publishedMenuRoutes.get(
  "/",
  authenticate,
  validate(publishedMenuSchema),
  viewPublishedMenuController
);

export default router;
