import express from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createUserSchema,
  assignUserRoleSchema,
  createCustomerSchema,
  createPermanentEmployeeSchema,
  assignCanteenRoleSchema,
  removeCanteenRoleSchema,
} from "./identity.validation.js";

import {
  getUsers,
  getRoles,
  getCustomers,
  createUserController,
  assignUserRoleController,
  createCustomerController,
  createPermanentEmployeeController,
  assignCanteenRoleController,
  removeCanteenRoleController,
  getCanteenRolesController,
} from "./identity.controller.js";

const router = express.Router();

router.get("/users", authenticate, authorizeRoles("SYSADM"), getUsers);

router.post(
  "/users",
  authenticate,
  authorizeRoles("SYSADM"),
  validate(createUserSchema),
  createUserController
);

router.post(
  "/user-roles",
  authenticate,
  authorizeRoles("SYSADM"),
  validate(assignUserRoleSchema),
  assignUserRoleController
);

router.get("/roles", authenticate, authorizeRoles("SYSADM"), getRoles);

router.get("/customers", authenticate, authorizeRoles("SYSADM"), getCustomers);

router.post(
  "/customers",
  authenticate,
  authorizeRoles("SYSADM"),
  validate(createCustomerSchema),
  createCustomerController
);

router.post(
  "/permanent-employees",
  authenticate,
  authorizeRoles("SYSADM"),
  validate(createPermanentEmployeeSchema),
  createPermanentEmployeeController
);

router.post(
  "/canteen-roles",
  authenticate,
  authorizeRoles("SYSADM"),
  validate(assignCanteenRoleSchema),
  assignCanteenRoleController
);

router.delete(
  "/canteen-roles",
  authenticate,
  authorizeRoles("SYSADM"),
  validate(removeCanteenRoleSchema),
  removeCanteenRoleController
);

router.get(
  "/canteen-roles/:userId",
  authenticate,
  authorizeRoles("SYSADM"),
  getCanteenRolesController
);

export default router;