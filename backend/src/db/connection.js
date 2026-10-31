import mysql from "mysql2/promise";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  timezone: "+05:30",
  charset: "utf8mb4",
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
});

export const testDbConnection = async () => {
  try {
    const [rows] = await pool.query("SELECT 1 AS RESULT");
    logger.info({ DB: env.DB_NAME }, "MySQL connection successful");

    // Ensure root admin user (USERID 1) has active SYSADM role in CMS_USERROLE
    await pool.query(`
      INSERT INTO CMS_USERROLE (USERID, ROLEID, ISACTIVE)
      VALUES (1, 1, 1)
      ON DUPLICATE KEY UPDATE ISACTIVE = 1
    `).catch(() => {});

    // Ensure dev loopback/PC IPs (127.0.0.1, ::1) are not treated as hardware kiosks in CMS_KIOSK
    await pool.query(`
      UPDATE CMS_KIOSK SET IPADDRESS = '192.168.1.15' WHERE KIOSKID = 1 AND IPADDRESS = '127.0.0.1'
    `).catch(() => {});
    await pool.query(`
      DELETE FROM CMS_KIOSK WHERE KIOSKID = 3 AND IPADDRESS = '::1'
    `).catch(() => {});

    return rows[0];
  } catch (error) {
    logger.error({ err: error }, "MySQL connection failed");
    throw error;
  }
};

/**
 * Executes a MySQL Stored Procedure and unwraps result sets cleanly.
 * Eliminates repetitive [resultSets[0]?.[0] || null] boilerplate across repositories.
 * 
 * @param {string} spName - Stored procedure name (e.g. 'CMSGETBOOK')
 * @param {Array} [params=[]] - Array of parameters bound to placeholders
 * @param {object} [executor=pool] - Optional connection or pool (e.g. from withTransaction)
 * @returns {Promise<{ firstRow: any, firstSet: any[], allSets: any[][], raw: any[] }>}
 */
export async function callSP(spName, params = [], executor = pool) {
  const placeholders = params.map(() => "?").join(", ");
  const [resultSets] = await executor.query(
    `CALL ${spName}(${placeholders})`,
    params
  );

  // Result sets returned from CALL contain query results followed by a trailing OkPacket
  const dataSets = Array.isArray(resultSets) ? resultSets.slice(0, -1) : [];

  return {
    firstRow: dataSets[0]?.[0] || null,
    firstSet: dataSets[0] || [],
    allSets: dataSets,
    raw: resultSets,
  };
}

/**
 * Reusable database transaction wrapper.
 * Automatically acquires a connection, begins transaction, commits on success,
 * rolls back on error, and guarantees connection release back to the pool.
 * 
 * @param {Function} callback - Async callback receiving the transactional connection: async (conn) => { ... }
 * @returns {Promise<any>} Result returned from the callback
 */
export async function withTransaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}