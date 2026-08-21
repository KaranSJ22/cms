import express from "express";

import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeRoles } from "../../middlwares/role.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
import {
  createMenuSchema,
  updateMenuSchema,
  menuIdSchema,
} from "./menu.validation.js";

import {
  createMenuController,
  updateMenuController,
  getMenusController,
  getMenuController,
} from "./menu.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  getMenusController
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(menuIdSchema),
  getMenuController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(createMenuSchema),
  createMenuController
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(updateMenuSchema),
  updateMenuController
);

export default router;
