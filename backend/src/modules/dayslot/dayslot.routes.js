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
  authorizeRoles("ADMIN", "CTNMNG", "CTNSTF"),
  getDaySlotsController
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG", "CTNSTF"),
  validate(daySlotIdSchema),
  getDaySlotController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG"),
  validate(createDaySlotSchema),
  createDaySlotController
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG"),
  validate(updateDaySlotSchema),
  updateDaySlotController
);

export default router;
