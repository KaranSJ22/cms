import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { findLoginInfoByLoginId } from "./auth.repository.js";
import { decryptToken } from "../../utils/ssoCrypto.js";

const generateLoginResponse = (user, CONSUMERROLES, CANTEENROLES) => {

  const systemRoles = CONSUMERROLES.map((role) => role.ROLECODE);

  const canteenRoles = CANTEENROLES.map((role) => ({
    CANTEENID: Number(role.CANTEENID),
    ROLECODE: role.ROLECODE,
    ISDEFAULT: Number(role.ISDEFAULT) === 1,
  }));

  const tokenPayload = {
    USERID: user.USERID,
    LOGINID: user.LOGINID, //same as userid for perm employee

    // time 5mins
    // decode this token and retrive userid for other webapp 

    CUSTOMERID: user.CUSTOMERID || null,
    CTYPECODE: user.CTYPECODE || null,

    SYSTEMROLES: systemRoles,
    CANTEENROLES: canteenRoles,
  };

  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );

  return {
    TOKEN: token,

    USER: {
      USERID: user.USERID,
      LOGINID: user.LOGINID,
      FULLNAME: user.FULLNAME,
      EMAIL: user.EMAIL,
      MOBILENO: user.MOBILENO,
      AUTHPROV: user.AUTHPROV,

      SYSTEMROLES: systemRoles,
      CANTEENROLES: canteenRoles,
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

export const loginUser = async ({ LOGINID, PASSWORD }) => {
  const {
    USER: user,
    CONSUMERROLES,
    CANTEENROLES,
  } = await findLoginInfoByLoginId(LOGINID);

  if (!user) {
    const error = new Error("Invalid login ID or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(
    PASSWORD,
    user.PWDHASH
  );

  if (!isPasswordValid) {
    const error = new Error("Invalid login ID or password");
    error.statusCode = 401;
    throw error;
  }

  return generateLoginResponse(user, CONSUMERROLES, CANTEENROLES);
};

export const ssoLoginUser = async ({ token }) => {
  let rawToken;
  try {
    rawToken = decryptToken(token);
  } catch (err) {
    const error = new Error("Invalid SSO token");
    error.statusCode = 401;
    throw error;
  }

  const parts = rawToken.split(":");
  if (parts.length !== 2) {
    const error = new Error("Malformed SSO token");
    error.statusCode = 401;
    throw error;
  }

  const [username, expiryStr] = parts;
  const expiry = parseInt(expiryStr, 10);

  if (isNaN(expiry) || Date.now() > expiry) {
    const error = new Error("SSO token expired");
    error.statusCode = 401;
    throw error;
  }

  const {
    USER: user,
    CONSUMERROLES,
    CANTEENROLES,
  } = await findLoginInfoByLoginId(username);

  if (!user) {
    const error = new Error("User not found via SSO");
    error.statusCode = 401;
    throw error;
  }

  return generateLoginResponse(user, CONSUMERROLES, CANTEENROLES);
};
