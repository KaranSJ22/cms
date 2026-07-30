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

router.get("/users", authenticate, authorizeRoles("ADMIN"), getUsers);

router.post(
  "/users",
  authenticate,
  authorizeRoles("ADMIN"),
  validate(createUserSchema),
  createUserController
);

router.post(
  "/user-roles",
  authenticate,
  authorizeRoles("ADMIN"),
  validate(assignUserRoleSchema),
  assignUserRoleController
);

router.get("/roles", authenticate, authorizeRoles("ADMIN"), getRoles);

router.get("/customers", authenticate, authorizeRoles("ADMIN"), getCustomers);

router.post(
  "/customers",
  authenticate,
  authorizeRoles("ADMIN"),
  validate(createCustomerSchema),
  createCustomerController
);


// router.post(
//   "/permanent-employees",
//   authenticate,
//   authorizeRoles("ADMIN"),
//   validate(createPermanentEmployeeSchema),
//   createPermanentEmployeeController
// );




export default router;