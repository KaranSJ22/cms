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
  assignCanteenRoleUsingProcedure,
  removeCanteenRoleUsingProcedure,
  getCanteenRolesByUserId,
} from "./identity.repository.js";

import bcrypt from "bcrypt";
import { pool } from "../../db/connection.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} from "../../common/errors/appError.js";

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
    throw new ConflictError("LOGINID already exists");
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
    throw new DatabaseError("User creation failed");
  }

  return await getUserById(created.USERID);
};

export const assignUserRole = async (roleData, assignedByUserId) => {
  const user = await findUserById(roleData.USERID);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (Number(user.ISACTIVE) !== 1) {
    throw new BadRequestError("Cannot assign role to inactive user");
  }

  const role = await findRoleById(roleData.ROLEID);

  if (!role) {
    throw new NotFoundError("Role not found");
  }

  if (Number(role.ISACTIVE) !== 1) {
    throw new BadRequestError("Cannot assign inactive role");
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
      throw new NotFoundError("User not found");
    }

    if (Number(user.ISACTIVE) !== 1) {
      throw new BadRequestError("Cannot create customer for inactive user");
    }

    const existingCustomer = await findCustomerByUserId(customerData.USERID);

    if (existingCustomer) {
      throw new ConflictError("Customer already exists for this user");
    }
  }

  const created = await createCustomerUsingProcedure({
    USERID: customerData.USERID || null,
    CTYPECODE: customerData.CTYPECODE,
    DISPNAME: customerData.DISPNAME,
    STATUS: customerData.STATUS || "ACT",
    VALIDFROM: customerData.VALIDFROM || null,
    VALIDUNTIL: customerData.VALIDUNTIL || null,
  });

  if (!created?.CUSTOMERID) {
    throw new DatabaseError("Customer creation failed");
  }

  return await getCustomerById(created.CUSTOMERID);
};



export const createPermanentEmployee = async (employeeData) => {
  const customer = await findCustomerById(employeeData.CUSTOMERID);

  if (!customer) {
    throw new NotFoundError("Customer not found");
  }

  if (customer.CTYPECODE !== "PRM") {
    throw new BadRequestError("Customer type must be PERMANENT");
  }

  const statusId = customer.STATUSID ?? customer.STATUS;
  const statusCode = customer.STATUSCODE;
  if (statusId !== 10 && statusCode !== "ACT") {
    throw new BadRequestError("Cannot create permanent employee profile for inactive customer");
  }

  const existingProfile = await findPermanentEmployeeByCustomerId(
    employeeData.CUSTOMERID
  );

  if (existingProfile) {
    throw new ConflictError("Permanent employee profile already exists for this customer");
  }

  const created = await createPermanentEmployeeUsingProcedure({
    CUSTOMERID: employeeData.CUSTOMERID,
    EMPCODE: employeeData.EMPCODE,
    DEPT: employeeData.DEPT,
    DESIG: employeeData.DESIG,
  });

  if (!created?.PERMEMPID) {
    throw new DatabaseError("Permanent employee profile creation failed");
  }

  // Use CMSGETPERM (via findPermanentEmployeeByCustomerId) to return the
  // full joined profile including customer and user details.
  return await findPermanentEmployeeByCustomerId(employeeData.CUSTOMERID);
};

export const assignCanteenRole = async (canteenRoleData, assignedByUserId) => {
  const user = await findUserById(canteenRoleData.USERID);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (Number(user.ISACTIVE) !== 1) {
    throw new BadRequestError("Cannot assign role to inactive user");
  }

  const role = await findRoleById(canteenRoleData.ROLEID);
  if (!role) {
    throw new NotFoundError("Role not found");
  }
  if (Number(role.ISACTIVE) !== 1) {
    throw new BadRequestError("Cannot assign inactive role");
  }

  await assignCanteenRoleUsingProcedure({
    USERID: canteenRoleData.USERID,
    ROLEID: canteenRoleData.ROLEID,
    CANTEENID: canteenRoleData.CANTEENID,
    ISDEFAULT: canteenRoleData.ISDEFAULT || 0,
    VALIDFROM: canteenRoleData.VALIDFROM || null,
    VALIDUNTIL: canteenRoleData.VALIDUNTIL || null,
    ASSIGNEDBY: assignedByUserId,
  });

  return await getCanteenRolesByUserId(canteenRoleData.USERID);
};

export const removeCanteenRole = async ({ USERID, ROLEID, CANTEENID }) => {
  await removeCanteenRoleUsingProcedure({ USERID, ROLEID, CANTEENID });
  return await getCanteenRolesByUserId(USERID);
};

export const fetchCanteenRoles = async (userId) => {
  return await getCanteenRolesByUserId(userId);
};

/**
 * Look up a customer profile by Employee ID (CONTCODE / EMPCODE), Login ID (LOGINID), or Customer ID.
 * (Raw SQL feature query maintained in service layer until mapped to stored procedure)
 */
export const findCustomerByIdentifier = async (identifier) => {
  if (!identifier) return null;
  const cleanId = String(identifier).trim();
  const numericId = /^\d+$/.test(cleanId) ? Number(cleanId) : null;

  const [rows] = await pool.query(
    `SELECT 
        c.CUSTOMERID,
        c.USERID,
        u.LOGINID,
        u.FULLNAME,
        u.EMAIL,
        u.MOBILENO,
        c.CTYPECODE,
        ct.CTYPENAME,
        c.DISPNAME,
        c.STATUSID,
        st.STATUSCODE,
        ce.CONTCODE,
        ce.VENDORNAME,
        pe.EMPCODE,
        pe.DEPT,
        pe.DESIG,
        COALESCE(ce.CONTCODE, pe.EMPCODE, oe.EMPCODE, u.LOGINID) AS EMPLOYEE_CODE
     FROM CMS_CUSTOMER c
     LEFT JOIN CMS_USER u ON u.USERID = c.USERID
     LEFT JOIN CMS_CUSTTYPE ct ON ct.CTYPECODE = c.CTYPECODE
     LEFT JOIN CMS_STATUS st ON st.STATUSID = c.STATUSID
     LEFT JOIN CMS_CONTEMP ce ON ce.CUSTOMERID = c.CUSTOMERID
     LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
     LEFT JOIN CMS_OCEEMP oe ON oe.CUSTOMERID = c.CUSTOMERID
     WHERE LOWER(ce.CONTCODE) = LOWER(?)
        OR LOWER(pe.EMPCODE) = LOWER(?)
        OR LOWER(oe.EMPCODE) = LOWER(?)
        OR LOWER(u.LOGINID) = LOWER(?)
        OR (? IS NOT NULL AND c.CUSTOMERID = ?)
     LIMIT 1`,
    [cleanId, cleanId, cleanId, cleanId, numericId, numericId]
  );

  return rows?.[0] || null;
};