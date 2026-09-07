import CryptoJS from "crypto-js";

/**
 * Generates an ISRO SSO Token (AES-128-ECB PKCS7 + Base64Url).
 * Valid for 5 minutes.
 * 
 * @param {string} loginId - e.g. "perm1", "cont1", "mgr1"
 * @param {string} secretKey - 16-byte secret key matching backend SSO_SECRET_KEY
 * @returns {string} Base64Url-encoded token
 */
export function generateSsoToken(loginId, secretKey = "1234567890123456") {
  // 5 minute expiration timestamp (milliseconds)
  const expiry = Date.now() + 5 * 60 * 1000;
  const raw = `${loginId.trim()}:${expiry}`;

  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const encrypted = CryptoJS.AES.encrypt(raw, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });

  const base64 = encrypted.toString();
  // Convert standard Base64 to URL-safe Base64 (Base64Url)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
