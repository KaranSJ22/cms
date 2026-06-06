import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

import {
  fetchUsers,
  fetchRoles,
  fetchCustomers,
  fetchApprovalLevels,
  createUser,
  assignUserRole,
  createCustomer,
  createPermanentEmployee,
} from "./identity.service.js";

export const getUsers = asyncHandler(async (req, res) => {
  const data = await fetchUsers();
  return sendSuccess(res, data, "Users fetched successfully");
});

export const getRoles = asyncHandler(async (req, res) => {
  const data = await fetchRoles();
  return sendSuccess(res, data, "Roles fetched successfully");
});

export const getCustomers = asyncHandler(async (req, res) => {
  const data = await fetchCustomers();
  return sendSuccess(res, data, "Customers fetched successfully");
});

export const getApprovalLevels = asyncHandler(async (req, res) => {
  const data = await fetchApprovalLevels();
  return sendSuccess(res, data, "Approval levels fetched successfully");
});

export const createUserController = asyncHandler(async (req, res) => {
  const data = await createUser(req.validated.body);

  return sendSuccess(res, data, "User created successfully", 201);
});

export const assignUserRoleController = asyncHandler(async (req, res) => {
  const data = await assignUserRole(req.validated.body, req.user.USERID);

  return sendSuccess(res, data, "Role assigned successfully", 201);
});

export const createCustomerController = asyncHandler(async (req, res) => {
  const data = await createCustomer(req.validated.body);

  return sendSuccess(res, data, "Customer created successfully", 201);
});

export const createPermanentEmployeeController = asyncHandler(
  async (req, res) => {
    const data = await createPermanentEmployee(req.validated.body);

    return sendSuccess(
      res,
      data,
      "Permanent employee profile created successfully",
      201
    );
  }
);