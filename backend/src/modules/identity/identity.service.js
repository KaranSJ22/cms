import {
  getAllUsers,
  getAllRoles,
  getAllCustomers,
  findUserByLoginId,
  createUserUsingProcedure,
  getUserById,
  findUserById,
  findRoleById,
  assignRoleUsingProcedure,
  getUserRolesByUserId,
  findCustomerByUserId,
  createCustomerUsingProcedure,
  getCustomerById,
  findCustomerById,
  findPermanentEmployeeByCustomerId,
  createPermanentEmployeeUsingProcedure,
} from "./identity.repository.js";

import bcrypt from "bcrypt";

export const fetchUsers = async (ISACTIVE = null) => {
  return await getAllUsers(ISACTIVE);
};

export const fetchRoles = async () => {
  return await getAllRoles();
};

export const fetchCustomers = async () => {
  return await getAllCustomers();
};

export const createUser = async (userData) => {
  const existingUser = await findUserByLoginId(userData.LOGINID);

  if (existingUser) {
    const error = new Error("LOGINID already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(userData.PASSWORD, 10);

  const created = await createUserUsingProcedure({
    LOGINID: userData.LOGINID,
    FULLNAME: userData.FULLNAME,
    EMAIL: userData.EMAIL || null,
    MOBILENO: userData.MOBILENO || null,
    PWDHASH: passwordHash,
    AUTHPROV: userData.AUTHPROV || "LOCAL",
    AUTHID: userData.AUTHID || null,
  });

  if (!created?.USERID) {
    const error = new Error("User creation failed");
    error.statusCode = 500;
    throw error;
  }

  return await getUserById(created.USERID);
};

export const assignUserRole = async (roleData, assignedByUserId) => {
  const user = await findUserById(roleData.USERID);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (Number(user.ISACTIVE) !== 1) {
    const error = new Error("Cannot assign role to inactive user");
    error.statusCode = 400;
    throw error;
  }

  const role = await findRoleById(roleData.ROLEID);

  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  if (Number(role.ISACTIVE) !== 1) {
    const error = new Error("Cannot assign inactive role");
    error.statusCode = 400;
    throw error;
  }

  await assignRoleUsingProcedure({
    USERID: roleData.USERID,
    ROLEID: roleData.ROLEID,
    ASSIGNEDBY: assignedByUserId,
    VALIDFROM: roleData.VALIDFROM || null,
    VALIDUNTIL: roleData.VALIDUNTIL || null,
  });

  return await getUserRolesByUserId(roleData.USERID);
};

export const createCustomer = async (customerData) => {
  if (customerData.USERID) {
    const user = await findUserById(customerData.USERID);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (Number(user.ISACTIVE) !== 1) {
      const error = new Error("Cannot create customer for inactive user");
      error.statusCode = 400;
      throw error;
    }

    const existingCustomer = await findCustomerByUserId(customerData.USERID);

    if (existingCustomer) {
      const error = new Error("Customer already exists for this user");
      error.statusCode = 409;
      throw error;
    }
  }

  const created = await createCustomerUsingProcedure({
    USERID: customerData.USERID || null,
    CTYPECODE: customerData.CTYPECODE,
    DISPNAME: customerData.DISPNAME,
    STATUS: customerData.STATUS || "A",
    VALIDFROM: customerData.VALIDFROM || null,
    VALIDUNTIL: customerData.VALIDUNTIL || null,
  });

  if (!created?.CUSTOMERID) {
    const error = new Error("Customer creation failed");
    error.statusCode = 500;
    throw error;
  }

  return await getCustomerById(created.CUSTOMERID);
};



export const createPermanentEmployee = async (employeeData) => {
  const customer = await findCustomerById(employeeData.CUSTOMERID);

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  if (customer.CTYPECODE !== "PERMANENT") {
    const error = new Error("Customer type must be PERMANENT");
    error.statusCode = 400;
    throw error;
  }

  if (customer.STATUS !== "A") {
    const error = new Error("Cannot create permanent employee profile for inactive customer");
    error.statusCode = 400;
    throw error;
  }

  const existingProfile = await findPermanentEmployeeByCustomerId(
    employeeData.CUSTOMERID
  );

  if (existingProfile) {
    const error = new Error("Permanent employee profile already exists for this customer");
    error.statusCode = 409;
    throw error;
  }

  const created = await createPermanentEmployeeUsingProcedure({
    CUSTOMERID: employeeData.CUSTOMERID,
    EMPCODE: employeeData.EMPCODE,
    DEPT: employeeData.DEPT,
    DESIG: employeeData.DESIG,
  });

  if (!created?.PERMEMPID) {
    const error = new Error("Permanent employee profile creation failed");
    error.statusCode = 500;
    throw error;
  }

  // Use CMSGETPERM (via findPermanentEmployeeByCustomerId) to return the
  // full joined profile including customer and user details.
  return await findPermanentEmployeeByCustomerId(employeeData.CUSTOMERID);
};