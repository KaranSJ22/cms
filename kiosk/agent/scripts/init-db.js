import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, closeDb } from "../src/db/sqlite.js";
import { logger } from "../src/utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = () => {
  logger.info("Initializing Kiosk SQLite database...");

  const schemaPath = path.resolve(__dirname, "../src/db/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  const db = getDb();

  // If upgrading existing database, recreate cached_customers if login_id column is missing
  try {
    const custCols = db.prepare("PRAGMA table_info(cached_customers);").all().map((c) => c.name);
    if (custCols.length > 0 && !custCols.includes("login_id")) {
      logger.info("Upgrading cached_customers schema: dropping legacy cache table...");
      db.exec("DROP TABLE IF EXISTS cached_customers;");
    }
  } catch {
    // Table doesn't exist yet, proceed
  }

  // If upgrading existing database, migrate outbox_bookings if token_no has legacy NOT NULL constraint
  try {
    const outboxCols = db.prepare("PRAGMA table_info(outbox_bookings);").all();
    const tokenCol = outboxCols.find((c) => c.name === "token_no");
    if (tokenCol && tokenCol.notnull === 1) {
      logger.info("Migrating outbox_bookings schema: removing legacy NOT NULL constraint on token_no...");
      db.exec(`
        CREATE TABLE outbox_bookings_v2 (
          offline_uuid TEXT PRIMARY KEY,
          kiosk_code TEXT NOT NULL,
          token_no TEXT,
          customer_id INTEGER NOT NULL,
          service_id INTEGER NOT NULL,
          serv_date TEXT NOT NULL,
          items_json TEXT NOT NULL,
          total_amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          created_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'PENDING',
          retry_count INTEGER DEFAULT 0,
          synced_at TEXT,
          sync_error TEXT
        );
        INSERT INTO outbox_bookings_v2 SELECT * FROM outbox_bookings;
        DROP TABLE outbox_bookings;
        ALTER TABLE outbox_bookings_v2 RENAME TO outbox_bookings;
        CREATE INDEX IF NOT EXISTS ix_outbox_status_created ON outbox_bookings(sync_status, created_at);
      `);
    }
  } catch {
    // Table doesn't exist yet, schema.sql will create it
  }

  db.exec(schemaSql);

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    .all();

  logger.info({ tableCount: tables.length, tables: tables.map((t) => t.name) }, "Database tables initialized successfully");
  return tables;
};

// If run directly via `node scripts/init-db.js`
if (process.argv[1] === __filename) {
  try {
    initializeDatabase();
    closeDb();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Database initialization failed");
    process.exit(1);
  }
}
