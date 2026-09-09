import express from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
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
  authorizeAnyCanteenRole("CNTMGR", "CNTAST", "CNTSTF"),
  getDaySlotsController
);

router.get(
  "/:id",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST", "CNTSTF"),
  validate(daySlotIdSchema),
  getDaySlotController
);

router.post(
  "/",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(createDaySlotSchema),
  createDaySlotController
);

router.put(
  "/:id",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(updateDaySlotSchema),
  updateDaySlotController
);

export default router;
