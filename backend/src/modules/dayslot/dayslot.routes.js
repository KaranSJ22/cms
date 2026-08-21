import express from "express";

import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeRoles } from "../../middlwares/role.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
import {
  createDaySlotSchema,
  updateDaySlotSchema,
  daySlotIdSchema,
} from "./dayslot.validation.js";

import {
  createDaySlotController,
  updateDaySlotController,
  getDaySlotsController,
  getDaySlotController,
} from "./dayslot.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  getDaySlotsController
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(daySlotIdSchema),
  getDaySlotController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(createDaySlotSchema),
  createDaySlotController
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(updateDaySlotSchema),
  updateDaySlotController
);

export default router;
