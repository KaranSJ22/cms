import { Router } from "express";
import { authorizeRoles as authorize } from "../../middlwares/role.middleware.js";
import { authenticate } from "../../middlwares/auth.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
import * as HolidayController from "./holiday.controller.js";
import * as validation from "./holiday.validation.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(["SYSADM"]),
  validate(validation.addHolidaySchema),
  HolidayController.addHoliday
);

router.get(
  "/",
  validate(validation.listHolidaysSchema),
  HolidayController.listHolidays
);

router.get(
  "/:id",
  authorize(["SYSADM"]),
  validate(validation.getHolidaySchema),
  HolidayController.getHoliday
);

router.put(
  "/:id",
  authorize(["SYSADM"]),
  validate(validation.updateHolidaySchema),
  HolidayController.updateHoliday
);

router.delete(
  "/:id",
  authorize(["SYSADM"]),
  validate(validation.getHolidaySchema), // reuse schema for id param validation
  HolidayController.deactivateHoliday
);

export default router;
