import request from "supertest";
import app from "../app.js";

/**
 * Standard seed users and default credentials.
 */
export const TEST_USERS = {
  ADMIN: { LOGINID: "admin", PASSWORD: "admin123", ROLE: "SYSADM" },
  MANAGER: { LOGINID: "mgr1", PASSWORD: "admin123", ROLE: "CTNMGR" },
  ASSISTANT: { LOGINID: "asst1", PASSWORD: "admin123", ROLE: "CTNAST" },
  STAFF: { LOGINID: "staff1", PASSWORD: "admin123", ROLE: "CTNSTF" },
  PERMANENT: { LOGINID: "perm1", PASSWORD: "admin123", ROLE: "PERM" },
  CONTRACT: { LOGINID: "cont1", PASSWORD: "admin123", ROLE: "CONT" },
  OCE: { LOGINID: "oce1", PASSWORD: "admin123", ROLE: "OCE" },
  VISITOR: { LOGINID: "vis1", PASSWORD: "admin123", ROLE: "VIS" },
};

// In-memory token cache to avoid redundant login HTTP calls in test suites
const tokenCache = new Map();

/**
 * Logs in and returns a valid JWT Bearer token string.
 * @param {string} loginId
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function getAuthToken(loginId = "perm1", password = "admin123") {
  const cacheKey = `${loginId}:${password}`;
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey);
  }

  const res = await request(app)
    .post("/api/auth/login")
    .send({ LOGINID: loginId, PASSWORD: password });

  if (!res.body?.SUCCESS || !res.body?.DATA?.TOKEN) {
    throw new Error(
      `Failed to obtain test auth token for user '${loginId}': ${res.body?.MESSAGE || res.status}`
    );
  }

  const token = res.body.DATA.TOKEN;
  tokenCache.set(cacheKey, token);
  return token;
}

/**
 * Returns an HTTP header object: { Authorization: "Bearer <token>" }
 * @param {string} loginId
 * @param {string} password
 * @returns {Promise<{ Authorization: string }>}
 */
export async function getAuthHeader(loginId = "perm1", password = "admin123") {
  const token = await getAuthToken(loginId, password);
  return { Authorization: `Bearer ${token}` };
}

/**
 * Calculates a future date formatted as 'YYYY-MM-DD' offset from current date.
 * @param {number} daysAhead
 * @returns {string}
 */
export function getFutureDate(daysAhead = 7) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Calculates a future ISO/MySQL datetime string offset from current date.
 * @param {number} daysAhead
 * @param {string} timeStr - default "23:59:59"
 * @returns {string}
 */
export function getFutureDateTime(daysAhead = 7, timeStr = "23:59:59") {
  const dStr = getFutureDate(daysAhead);
  return `${dStr}T${timeStr}`;
}
