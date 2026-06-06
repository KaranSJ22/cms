import { pool } from "../../db/connection.js";

export const getAllUsers = async () => {
  const [rows] = await pool.execute(`
    SELECT 
      USERID,
      LOGINID,
      FULLNAME,
      EMAIL,
      MOBILENO,
      AUTHPROV,
      ISACTIVE,
      CREATEDAT,
      UPDATEDAT
    FROM CMS_USER
    ORDER BY USERID DESC
  `);

  return rows;
};

export const getAllRoles = async () => {
  const [rows] = await pool.execute(`
    SELECT 
      ROLEID,
      ROLECODE,
      ROLENAME,
      DESCR,
      ISACTIVE,
      CREATEDAT,
      UPDATEDAT
    FROM CMS_ROLE
    ORDER BY ROLEID
  `);

  return rows;
};

export const getAllCustomers = async () => {
  const [rows] = await pool.execute(`
    SELECT
      C.CUSTOMERID,
      C.USERID,
      U.LOGINID,
      U.FULLNAME,
      C.CTYPECODE,
      CT.CTYPENAME,
      C.DISPNAME,
      C.STATUS,
      C.VALIDFROM,
      C.VALIDUNTIL,
      C.CREATEDAT,
      C.UPDATEDAT
    FROM CMS_CUSTOMER C
    LEFT JOIN CMS_USER U 
      ON C.USERID = U.USERID
    LEFT JOIN CMS_CUSTTYPE CT
      ON C.CTYPECODE = CT.CTYPECODE
    ORDER BY C.CUSTOMERID DESC
  `);

  return rows;
};

export const getAllApprovalLevels = async () => {
  const [rows] = await pool.execute(`
    SELECT
      A.APPLVLID,
      A.LEVELNO,
      A.LEVELNAME,
      A.ROLEID,
      R.ROLECODE,
      R.ROLENAME,
      A.DESCR,
      A.ISACTIVE,
      A.CREATEDAT,
      A.UPDATEDAT
    FROM CMS_APPLVL A
    LEFT JOIN CMS_ROLE R
      ON A.ROLEID = R.ROLEID
    ORDER BY A.LEVELNO
  `);

  return rows;
};

export const findUserByLoginId = async (LOGINID) => {
  const [rows] = await pool.execute(
    `
    SELECT 
      USERID,
      LOGINID,
      FULLNAME,
      EMAIL,
      MOBILENO,
      AUTHPROV,
      ISACTIVE,
      CREATEDAT,
      UPDATEDAT
    FROM CMS_USER
    WHERE LOGINID = ?
    `,
    [LOGINID]
  );

  return rows[0] || null;
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
  const [rows] = await pool.execute(
    `
    SELECT 
      USERID,
      LOGINID,
      FULLNAME,
      EMAIL,
      MOBILENO,
      AUTHPROV,
      ISACTIVE,
      CREATEDAT,
      UPDATEDAT
    FROM CMS_USER
    WHERE USERID = ?
    `,
    [USERID]
  );

  return rows[0] || null;
};

export const findUserById = async (USERID) => {
  const [rows] = await pool.execute(
    `
    SELECT USERID, LOGINID, FULLNAME, ISACTIVE
    FROM CMS_USER
    WHERE USERID = ?
    `,
    [USERID]
  );

  return rows[0] || null;
};

export const findRoleById = async (ROLEID) => {
  const [rows] = await pool.execute(
    `
    SELECT ROLEID, ROLECODE, ROLENAME, ISACTIVE
    FROM CMS_ROLE
    WHERE ROLEID = ?
    `,
    [ROLEID]
  );

  return rows[0] || null;
};

export const assignRoleUsingProcedure = async ({
  USERID,
  ROLEID,
  ASSIGNEDBY,
  VALIDFROM = null,
  VALIDUNTIL = null,
}) => {
  await pool.execute(
    "CALL CMSASSIGNROL(?, ?, ?, ?, ?)",
    [USERID, ROLEID, ASSIGNEDBY, VALIDFROM, VALIDUNTIL]
  );

  return true;
};

export const getUserRolesByUserId = async (USERID) => {
  const [rows] = await pool.execute(
    `
    SELECT
      UR.USRROLEID,
      UR.USERID,
      U.LOGINID,
      U.FULLNAME,
      UR.ROLEID,
      R.ROLECODE,
      R.ROLENAME,
      UR.ASSIGNEDBY,
      UR.ASSIGNEDAT,
      UR.VALIDFROM,
      UR.VALIDUNTIL,
      UR.ISACTIVE
    FROM CMS_USRROLE UR
    JOIN CMS_USER U
      ON UR.USERID = U.USERID
    JOIN CMS_ROLE R
      ON UR.ROLEID = R.ROLEID
    WHERE UR.USERID = ?
    ORDER BY UR.USRROLEID DESC
    `,
    [USERID]
  );

  return rows;
};

export const findCustomerByUserId = async (USERID) => {
  const [rows] = await pool.execute(
    `
    SELECT 
      CUSTOMERID,
      USERID,
      CTYPECODE,
      DISPNAME,
      STATUS
    FROM CMS_CUSTOMER
    WHERE USERID = ?
    `,
    [USERID]
  );

  return rows[0] || null;
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
  const [rows] = await pool.execute(
    `
    SELECT
      C.CUSTOMERID,
      C.USERID,
      U.LOGINID,
      U.FULLNAME,
      C.CTYPECODE,
      CT.CTYPENAME,
      C.DISPNAME,
      C.STATUS,
      C.VALIDFROM,
      C.VALIDUNTIL,
      C.CREATEDAT,
      C.UPDATEDAT
    FROM CMS_CUSTOMER C
    LEFT JOIN CMS_USER U 
      ON C.USERID = U.USERID
    LEFT JOIN CMS_CUSTTYPE CT
      ON C.CTYPECODE = CT.CTYPECODE
    WHERE C.CUSTOMERID = ?
    `,
    [CUSTOMERID]
  );

  return rows[0] || null;
};


export const findCustomerById = async (CUSTOMERID) => {
  const [rows] = await pool.execute(
    `
    SELECT
      CUSTOMERID,
      USERID,
      CTYPECODE,
      DISPNAME,
      STATUS
    FROM CMS_CUSTOMER
    WHERE CUSTOMERID = ?
    `,
    [CUSTOMERID]
  );

  return rows[0] || null;
};

export const findPermanentEmployeeByCustomerId = async (CUSTOMERID) => {
  const [rows] = await pool.execute(
    `
    SELECT
      PERMEMPID,
      CUSTOMERID,
      EMPCODE,
      DEPT,
      DESIG
    FROM CMS_PERMEMP
    WHERE CUSTOMERID = ?
    `,
    [CUSTOMERID]
  );

  return rows[0] || null;
};

export const createPermanentEmployeeUsingProcedure = async ({
  CUSTOMERID,
  EMPCODE,
  DEPT,
  DESIG,
}) => {
  const [resultSets] = await pool.execute(
    "CALL CMSADDPERM(?, ?, ?, ?)",
    [CUSTOMERID, EMPCODE, DEPT, DESIG]
  );

  const rows = resultSets[0];
  return rows?.[0] || null;
};

export const getPermanentEmployeeById = async (PERMEMPID) => {
  const [rows] = await pool.execute(
    `
    SELECT
      P.PERMEMPID,
      P.CUSTOMERID,
      C.DISPNAME,
      C.CTYPECODE,
      P.EMPCODE,
      P.DEPT,
      P.DESIG,
      P.CREATEDAT,
      P.UPDATEDAT
    FROM CMS_PERMEMP P
    JOIN CMS_CUSTOMER C
      ON P.CUSTOMERID = C.CUSTOMERID
    WHERE P.PERMEMPID = ?
    `,
    [PERMEMPID]
  );

  return rows[0] || null;
};