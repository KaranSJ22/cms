import express from "express";

import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeRoles } from "../../middlwares/role.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
import {
  createUserSchema,
  assignUserRoleSchema,
  createCustomerSchema,
  // createPermanentEmployeeSchema,
} from "./identity.validation.js";

import {
  getUsers,
  getRoles,
  getCustomers,
  createUserController,
  assignUserRoleController,
  createCustomerController,
  // createPermanentEmployeeController,
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


// router.post(
//   "/permanent-employees",
//   authenticate,
//   authorizeRoles("SYSADM"),
//   validate(createPermanentEmployeeSchema),
//   createPermanentEmployeeController
// );




export default router;