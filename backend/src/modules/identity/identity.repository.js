import { pool } from "../../db/connection.js";

export const getAllUsers = async (ISACTIVE = null) => {
  const [resultSets] = await pool.execute("CALL CMSLISTUSER(?)", [ISACTIVE]);

  return resultSets[0];
};

export const getAllRoles = async () => {
  const [resultSets] = await pool.execute("CALL CMSLISTROL()");

  return resultSets[0];
};

export const getAllCustomers = async (TYPECODE = null, STATUS = null) => {
  const [resultSets] = await pool.execute("CALL CMSLISTCUST(?, ?)", [
    TYPECODE,
    STATUS,
  ]);

  return resultSets[0];
};

// NOT USEFULL
export const findUserByLoginId = async (LOGINID) => {
  const [resultSets] = await pool.execute(`CALL CMSLOGININFO(?)`, [LOGINID]);

  return resultSets[0] || null;
};

export const createUserUsingProcedure = async ({
  LOGINID,
  FULLNAME,
  EMAIL = null,
  MOBILENO = null,
  PWDHASH,
  AUTHPROV = "LOCAL",
  AUTHID = null,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDUSER(?, ?, ?, ?, ?, ?, ?)",
    [LOGINID, FULLNAME, EMAIL, MOBILENO, PWDHASH, AUTHPROV, AUTHID]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const getUserById = async (USERID) => {
  const [resultSets] = await pool.execute("CALL CMSGETUSER(?)", [USERID]);

  return resultSets[0]?.[0] || null;
};

export const findUserById = async (USERID) => {
  const [resultSets] = await pool.execute("CALL CMSGETUSER(?)", [USERID]);

  return resultSets[0]?.[0] || null;
};

export const findRoleById = async (ROLEID) => {
  const [resultSets] = await pool.execute("CALL CMSGETROL(?)", [ROLEID]);

  return resultSets[0]?.[0] || null;
};

export const assignRoleUsingProcedure = async ({
  USERID,
  ROLEID,
  ASSIGNEDBY,
  VALIDFROM = null,
  VALIDUNTIL = null,
}) => {
  await pool.execute("CALL CMSASSIGNCONSROL(?, ?, ?, ?, ?)", [
    USERID,
    ROLEID,
    ASSIGNEDBY,
    VALIDFROM,
    VALIDUNTIL,
  ]);

  return true;
};

export const getUserRolesByUserId = async (USERID) => {
  const [resultSets] = await pool.execute("CALL CMSLISTCONSROL(?)", [USERID]);

  return resultSets[0] || [];
};

export const findCustomerByUserId = async (USERID) => {
  const [resultSets] = await pool.execute("CALL CMSGETCUSTBYUSER(?)", [
    USERID,
  ]);

  return resultSets[0]?.[0] || null;
};

export const createCustomerUsingProcedure = async ({
  USERID = null,
  CTYPECODE,
  DISPNAME,
  STATUS = "A",
  VALIDFROM = null,
  VALIDUNTIL = null,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDCUST(?, ?, ?, ?, ?, ?)",
    [USERID, CTYPECODE, DISPNAME, STATUS, VALIDFROM, VALIDUNTIL]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const getCustomerById = async (CUSTOMERID) => {
  const [resultSets] = await pool.execute("CALL CMSGETCUST(?)", [CUSTOMERID]);

  return resultSets[0]?.[0] || null;
};

export const findCustomerById = async (CUSTOMERID) => {
  const [resultSets] = await pool.execute("CALL CMSGETCUST(?)", [CUSTOMERID]);

  return resultSets[0]?.[0] || null;
};

export const findPermanentEmployeeByCustomerId = async (CUSTOMERID) => {
  const [resultSets] = await pool.execute("CALL CMSGETPERM(?)", [CUSTOMERID]);

  return resultSets[0]?.[0] || null;
};

export const createPermanentEmployeeUsingProcedure = async ({
  CUSTOMERID,
  EMPCODE,
  DEPT,
  DESIG,
}) => {
  const [resultSets] = await pool.execute("CALL CMSADDPERM(?, ?, ?, ?)", [
    CUSTOMERID,
    EMPCODE,
    DEPT,
    DESIG,
  ]);

  const rows = resultSets[0];
  return rows?.[0] || null;
};