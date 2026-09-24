import crypto from "crypto";
import { UnauthorizedError } from "../common/errors/appError.js";
import { env } from "../config/env.js";

const getSecretKey = () => {
  const key = env.SSO_SECRET_KEY || process.env.SSO_SECRET_KEY;
  if (!key || Buffer.from(key, "utf8").length !== 16) {
    throw new UnauthorizedError("SSO authentication failed: Invalid or missing SSO secret key configuration");
  }
  return key;
};

/**
 * Decrypts a Base64Url encoded AES token.
 * Java Cipher.getInstance("AES") without mode defaults to AES/ECB/PKCS5Padding.
 * In Node.js, we use aes-128-ecb with PKCS7 (which is compatible with PKCS5).
 * 
 * @param {string} token 
 * @returns {string} The decrypted raw string (username:expiry)
 */
export const decryptToken = (token) => {
  try {
    const secretKey = getSecretKey();

    // Convert Base64Url to standard Base64
    let base64Token = token.replace(/-/g, "+").replace(/_/g, "/");

    // Pad the base64 string if necessary
    while (base64Token.length % 4) {
      base64Token += "=";
    }

    const decipher = crypto.createDecipheriv(
      "aes-128-ecb",
      Buffer.from(secretKey, "utf-8"),
      null // ECB mode does not use an IV
    );

    let decrypted = decipher.update(base64Token, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new UnauthorizedError("Invalid or corrupted SSO token");
  }
};

/**
 * Encrypts a username into an SSO token (for testing).
 * 
 * @param {string} username 
 * @returns {string} The Base64Url encoded encrypted token
 */
export const encryptToken = (username) => {
  const expiry = Date.now() + 5 * 60 * 1000; // 5 min expiry as requested
  const raw = `${username}:${expiry}`;

  const cipher = crypto.createCipheriv(
    "aes-128-ecb",
    Buffer.from(SECRET_KEY, "utf-8"),
    null
  );

  let encrypted = cipher.update(raw, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Convert standard Base64 to Base64Url
  return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
