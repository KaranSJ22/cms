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
});

export const testDbConnection = async () => {
  try {
    const [rows] = await pool.query("SELECT 1 AS RESULT");
    logger.info({ DB: env.DB_NAME }, "MySQL connection successful");
    return rows[0];
  } catch (error) {
    logger.error({ err: error }, "MySQL connection failed");
    throw error;
  }
};