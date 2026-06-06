import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { findLoginInfoByLoginId } from "./auth.repository.js";

export const loginUser = async ({ LOGINID, PASSWORD }) => {
  const user = await findLoginInfoByLoginId(LOGINID);

  if (!user) {
    const error = new Error("Invalid login ID or password");
    error.statusCode = 401;
    throw error;
  }

  if (Number(user.ISACTIVE) !== 1) {
    const error = new Error("User account is disabled");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(PASSWORD, user.PWDHASH);

  if (!isPasswordValid) {
    const error = new Error("Invalid login ID or password");
    error.statusCode = 401;
    throw error;
  }

  const roles = user.ROLECODES
    ? user.ROLECODES.split(",").map((role) => role.trim())
    : [];

  const tokenPayload = {
    USERID: user.USERID,
    LOGINID: user.LOGINID,
    ROLES: roles,
    CUSTOMERID: user.CUSTOMERID || null,
    CTYPECODE: user.CTYPECODE || null,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

  return {
    TOKEN: token,
    USER: {
      USERID: user.USERID,
      LOGINID: user.LOGINID,
      FULLNAME: user.FULLNAME,
      EMAIL: user.EMAIL,
      MOBILENO: user.MOBILENO,
      AUTHPROV: user.AUTHPROV,
      ROLES: roles,
    },
    CUSTOMER: user.CUSTOMERID
      ? {
          CUSTOMERID: user.CUSTOMERID,
          CTYPECODE: user.CTYPECODE,
          DISPNAME: user.DISPNAME,
        }
      : null,
  };
};