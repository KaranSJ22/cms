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
  authorizeRoles("ADMIN", "CTNMNG", "CTNSTF"),
  getMenusController
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG", "CTNSTF"),
  validate(menuIdSchema),
  getMenuController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG"),
  validate(createMenuSchema),
  createMenuController
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG"),
  validate(updateMenuSchema),
  updateMenuController
);

export default router;
