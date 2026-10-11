import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let dbInstance = null;

export const getDb = () => {
  if (dbInstance) return dbInstance;

  const dbDir = path.dirname(path.resolve(env.DB_PATH));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info({ dbDir }, "Created SQLite storage directory");
  }

  const dbPath = path.resolve(env.DB_PATH);
  dbInstance = new Database(dbPath, {
    verbose: env.NODE_ENV === "development" ? (msg) => logger.debug({ sqlite: msg }) : undefined,
  });

  // Enable WAL mode & performance pragmas for Raspberry Pi flash storage
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("synchronous = NORMAL");
  dbInstance.pragma("foreign_keys = ON");
  dbInstance.pragma("busy_timeout = 5000");

  logger.info({ dbPath }, "SQLite database connected in WAL mode");
  return dbInstance;
};

/**
 * Executes a callback within a managed SQLite transaction.
 * Automatically commits on return or rolls back on exception.
 */
export const withTransaction = (callback) => {
  const db = getDb();
  const tx = db.transaction((...args) => callback(db, ...args));
  return tx();
};

/**
 * Gracefully flushes WAL buffers and closes SQLite connection.
 */
export const closeDb = () => {
  if (dbInstance) {
    try {
      dbInstance.pragma("wal_checkpoint(TRUNCATE)");
      dbInstance.close();
      logger.info("SQLite database connection closed cleanly");
    } catch (err) {
      logger.error({ err }, "Error closing SQLite database");
    } finally {
      dbInstance = null;
    }
  }
};
