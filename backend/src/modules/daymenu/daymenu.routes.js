import express from "express";

import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeRoles } from "../../middlwares/role.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
import {
  createDayMenuSchema,
  approveDayMenuSchema,
  dayMenuIdSchema,
  publishedMenuSchema,
  getDayMenusSchema,
} from "./daymenu.validation.js";

import {
  createDayMenuController,
  approveDayMenuController,
  rejectDayMenuController,
  getDayMenusController,
  getDayMenuController,
  viewPublishedMenuController,
} from "./daymenu.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(getDayMenusSchema),
  getDayMenusController
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(dayMenuIdSchema),
  getDayMenuController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(createDayMenuSchema),
  createDayMenuController
);

router.patch(
  "/:id/approve",
  authenticate,
  authorizeRoles("CTNMNG"),
  validate(approveDayMenuSchema),
  approveDayMenuController
);

router.patch(
  "/:id/reject",
  authenticate,
  authorizeRoles("CTNMNG"),
  validate(approveDayMenuSchema),
  rejectDayMenuController
);

export const publishedMenuRoutes = express.Router();

publishedMenuRoutes.get(
  "/",
  authenticate,
  validate(publishedMenuSchema),
  viewPublishedMenuController
);

export default router;
