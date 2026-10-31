import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeSystemRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  getCanteensSchema,
  canteenIdParamSchema,
  createCanteenSchema,
  updateCanteenSchema,
  createCenterSchema,
} from "./canteen.validation.js";
import {
  getCanteens,
  getCanteenByIdController,
  createCanteenController,
  updateCanteenController,
  deactivateCanteenController,
  listCentersController,
  createCenterController,
} from "./canteen.controller.js";

const router = express.Router();

// ------------------------------------------------------------
// Campus Centers (Read: All users / Write: SYSADM)
// ------------------------------------------------------------
router.get("/centers", authenticate, listCentersController);
router.post(
  "/centers",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(createCenterSchema),
  createCenterController
);

// ------------------------------------------------------------
// Canteen Facilities (Read: All users / Write: SYSADM)
// ------------------------------------------------------------
router.get("/", authenticate, validate(getCanteensSchema), getCanteens);
router.get("/:id", authenticate, validate(canteenIdParamSchema), getCanteenByIdController);

router.post(
  "/",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(createCanteenSchema),
  createCanteenController
);

router.put(
  "/:id",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(updateCanteenSchema),
  updateCanteenController
);

router.delete(
  "/:id",
  authenticate,
  authorizeSystemRoles("SYSADM"),
  validate(canteenIdParamSchema),
  deactivateCanteenController
);

export default router;
