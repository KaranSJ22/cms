import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const baseDbDir = [
  path.resolve(__dirname, "../../database"),
  path.resolve(__dirname, "../database"),
  "/app/database"
].find((dir) => fs.existsSync(dir)) || path.resolve(__dirname, "../../database");
const schemaDir = path.join(baseDbDir, "schema");
const proceduresDir = path.join(baseDbDir, "procedures");
const eventsDir = path.join(baseDbDir, "events");
const seedDir = path.join(baseDbDir, "seed");

// Preferred execution order for procedures (Common/GenAuto must come first)
const PREFERRED_PROC_ORDER = [
  path.join("common", "write", "COMMON_GENAUTO.sql"),
  path.join("common", "write", "COMMON_WRITE_PROCEDURES.sql"),
  path.join("common", "read", "COMMON_READ_PROCEDURES.sql"),
  path.join("identity", "write", "IDENTITY_WRITE_PROCEDURES.sql"),
  path.join("identity", "read", "IDENTITY_READ_PROCEDURES.sql"),
  path.join("canteen", "write", "CANTEEN_WRITE_PROCEDURES.sql"),
  path.join("canteen", "read", "CANTEEN_READ_PROCEDURES.sql"),
  path.join("dayslot", "write", "DAYSLOT_WRITE_PROCEDURES.sql"),
  path.join("dayslot", "read", "DAYSLOT_READ_PROCEDURES.sql"),
  path.join("menuitem", "write", "MENUITEM_WRITE_PROCEDURES.sql"),
  path.join("menuitem", "read", "MENUITEM_READ_PROCEDURES.sql"),
  path.join("daymenu", "write", "DAYMENU_WRITE_PROCEDURES.sql"),
  path.join("daymenu", "read", "DAYMENU_READ_PROCEDURES.sql"),
  path.join("menutemplate", "write", "MENUTEMPLATE_WRITE_PROCEDURES.sql"),
  path.join("menutemplate", "read", "MENUTEMPLATE_READ_PROCEDURES.sql"),
  path.join("booking", "write", "BOOKING_WRITE_PROCEDURES.sql"),
  path.join("booking", "write", "BOOKING_WEEKLY_BATCH.sql"),
  path.join("booking", "read", "BOOKING_READ_PROCEDURES.sql"),
  path.join("wallet", "write", "WALLET_WRITE_PROCEDURES.sql"),
  path.join("wallet", "read", "WALLET_READ_PROCEDURES.sql"),
  path.join("kiosk", "write", "KIOSK_WRITE_PROCEDURES.sql"),
  path.join("kiosk", "read", "KIOSK_READ_PROCEDURES.sql"),
  path.join("officialrequest", "write", "OFFICIAL_WRITE_PROCEDURES.sql"),
  path.join("officialrequest", "read", "OFFICIAL_READ_PROCEDURES.sql"),
  path.join("reporting", "write", "REPORTING_WRITE_PROCEDURES.sql"),
  path.join("reporting", "read", "REPORTING_READ_PROCEDURES.sql"),
];

/**
 * Strips hardcoded `USE db_name;` statements so scripts execute in
 * whatever database the connection is bound to.
 */
function sanitizeSql(sqlContent) {
  return sqlContent
    .split(/\r?\n/)
    .filter((line) => !/^USE\s+[\w`]+;/i.test(line.trim()))
    .join("\n");
}

/**
 * Splits raw SQL content into executable statements respecting MySQL DELIMITER commands.
 */
function parseSqlStatements(sqlContent) {
  const statements = [];
  const lines = sqlContent.split(/\r?\n/);
  let currentDelimiter = ";";
  let currentStatement = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for DELIMITER command
    const delimiterMatch = trimmedLine.match(/^DELIMITER\s+(\S+)/i);
    if (delimiterMatch) {
      if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      }
      currentDelimiter = delimiterMatch[1];
      continue;
    }

    // Ignore standalone USE statements
    if (/^USE\s+[\w`]+;/i.test(trimmedLine)) {
      continue;
    }

    currentStatement += line + "\n";

    if (currentDelimiter === ";") {
      if (trimmedLine.endsWith(";")) {
        const stmt = currentStatement.trim().replace(/;$/, "");
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = "";
      }
    } else {
      const delimIndex = currentStatement.lastIndexOf(currentDelimiter);
      if (delimIndex !== -1 && currentStatement.slice(delimIndex).trim() === currentDelimiter) {
        const stmt = currentStatement.slice(0, delimIndex).trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = "";
      }
    }
  }

  if (currentStatement.trim().length > 0) {
    const escapedDelim = currentDelimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const finalStmt = currentStatement.trim().replace(new RegExp(`${escapedDelim}$`), "");
    if (finalStmt.length > 0) {
      statements.push(finalStmt);
    }
  }

  return statements.filter((s) => s.length > 0);
}

/**
 * Recursively retrieves all .sql files in a directory.
 */
function getSqlFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getSqlFilesRecursively(filePath));
    } else if (file.endsWith(".sql")) {
      results.push(filePath);
    }
  }
  return results;
}

/**
 * Safely drops all database objects (views, tables, procedures, events)
 * respecting foreign key constraints.
 */
async function cleanDatabase(connection) {
  console.log("=========================================================");
  console.log(" PHASE 0: TEARDOWN (Dropping existing database objects)  ");
  console.log("=========================================================");

  await connection.query("SET FOREIGN_KEY_CHECKS = 0");

  // 1. Drop all Views
  const [views] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
  let viewCount = 0;
  let viewFailCount = 0;
  for (const row of views) {
    const viewName = Object.values(row)[0];
    try {
      await connection.query(`DROP VIEW IF EXISTS \`${viewName}\``);
      process.stdout.write(`  [DROP VIEW] ${viewName}\n`);
      viewCount++;
    } catch (err) {
      if (err.message.includes("SYSTEM_USER")) {
        process.stdout.write(`  [SKIP VIEW] ${viewName} (Needs root or SYSTEM_USER privilege to drop)\n`);
        viewFailCount++;
      } else {
        throw err;
      }
    }
  }

  // 2. Drop all Base Tables
  const [tables] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  let tableCount = 0;
  let tableFailCount = 0;
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    try {
      await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      process.stdout.write(`  [DROP TABLE] ${tableName}\n`);
      tableCount++;
    } catch (err) {
      if (err.message.includes("SYSTEM_USER")) {
        process.stdout.write(`  [SKIP TABLE] ${tableName} (Needs root or SYSTEM_USER privilege to drop)\n`);
        tableFailCount++;
      } else {
        throw err;
      }
    }
  }

  // 3. Drop all Stored Procedures
  const [procs] = await connection.query(
    "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE'"
  );
  let procCount = 0;
  let procFailCount = 0;
  for (const row of procs) {
    try {
      await connection.query(`DROP PROCEDURE IF EXISTS \`${row.ROUTINE_NAME}\``);
      process.stdout.write(`  [DROP PROCEDURE] ${row.ROUTINE_NAME}\n`);
      procCount++;
    } catch (err) {
      if (err.message.includes("SYSTEM_USER")) {
        process.stdout.write(`  [SKIP PROCEDURE] ${row.ROUTINE_NAME} (Needs root or SYSTEM_USER privilege to drop)\n`);
        procFailCount++;
      } else {
        throw err;
      }
    }
  }

  // 4. Drop all Scheduled Events
  const [events] = await connection.query(
    "SELECT EVENT_NAME FROM INFORMATION_SCHEMA.EVENTS WHERE EVENT_SCHEMA = DATABASE()"
  );
  let eventCount = 0;
  for (const row of events) {
    try {
      await connection.query(`DROP EVENT IF EXISTS \`${row.EVENT_NAME}\``);
      process.stdout.write(`  [DROP EVENT] ${row.EVENT_NAME}\n`);
      eventCount++;
    } catch (err) {
      process.stdout.write(`  [SKIP EVENT] ${row.EVENT_NAME} (${err.message})\n`);
    }
  }

  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log(`Teardown Complete: Dropped ${viewCount} views, ${tableCount} tables, ${procCount} procedures, and ${eventCount} events.`);
  const totalSkipped = viewFailCount + tableFailCount + procFailCount;
  if (totalSkipped > 0) {
    console.warn(`\n[NOTE] ${totalSkipped} object(s) were originally created by 'root'. In MySQL 8, objects defined by root require root credentials (SYSTEM_USER privilege) to drop or replace.`);
    console.warn(`To drop them as root, run:`);
    console.warn(`  npm run db:drop -- --user=root --password=<root_password>\n`);
  } else {
    console.log("");
  }
}

async function run() {
  console.log("=========================================================");
  console.log(" ISRO CMS — Complete SQL Runner (In Dependency Order)   ");
  console.log("=========================================================\n");

  const args = process.argv.slice(2);
  let customUser = null;
  let customPassword = null;
  let customHost = null;
  let customPort = null;
  let customDb = null;
  let customSsl = null;

  const cleanVal = (v) => (v ? v.replace(/^["']|["']$/g, "").trim() : v);
  for (const arg of args) {
    if (arg.startsWith("--user=") || arg.startsWith("-u=")) customUser = cleanVal(arg.split("=").slice(1).join("="));
    else if (arg.startsWith("--password=") || arg.startsWith("-p=")) customPassword = cleanVal(arg.split("=").slice(1).join("="));
    else if (arg.startsWith("--host=") || arg.startsWith("-h=")) customHost = cleanVal(arg.split("=").slice(1).join("="));
    else if (arg.startsWith("--port=") || arg.startsWith("-P=")) customPort = cleanVal(arg.split("=").slice(1).join("="));
    else if (arg.startsWith("--database=") || arg.startsWith("-d=")) customDb = cleanVal(arg.split("=").slice(1).join("="));
    else if (arg.startsWith("--ssl=")) customSsl = cleanVal(arg.split("=").slice(1).join("="));
  }

  const isSchemasOnly = args.includes("--schemas-only");
  const isProcsOnly = args.includes("--procs-only");
  const isSeedOnly = args.includes("--seed-only");
  const isSkipSeed = args.includes("--skip-seed");
  const isVerifyOnly = args.includes("--verify");
  const isDropOnly = args.includes("--drop-only") || args.includes("--clean-only");
  const isNoDrop = args.includes("--no-drop") || args.includes("--skip-drop");
  const isIfEmpty = args.includes("--if-empty");

  const useSsl = customSsl !== null ? customSsl === "true" : process.env.DB_SSL === "true";

  const connConfig = {
    host: customHost || process.env.DB_HOST || "127.0.0.1",
    port: customPort ? Number(customPort) : (Number(process.env.DB_PORT) || 3306),
    user: customUser || process.env.DB_USER || "root",
    password: customPassword !== null ? customPassword : (process.env.DB_PASSWORD || ""),
    database: customDb || process.env.DB_NAME || "CMS_DB",
    multipleStatements: true,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };

  console.log(`Connecting to '${connConfig.database}' on ${connConfig.host}:${connConfig.port} as '${connConfig.user}' (SSL: ${useSsl ? "ON" : "OFF"})...`);
  let connection;
  try {
    connection = await mysql.createConnection(connConfig);
    console.log("Connected successfully!\n");
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }

  try {
    if (isVerifyOnly) {
      await printVerification(connection);
      return;
    }

    if (isDropOnly) {
      await cleanDatabase(connection);
      await printVerification(connection);
      return;
    }

    const runSchemas = !isProcsOnly && !isSeedOnly;
    const runProcs = !isSchemasOnly && !isSeedOnly;
    const runEvents = !isSchemasOnly && !isProcsOnly && !isSeedOnly;
    const runSeeds = !isSchemasOnly && !isProcsOnly && !isSkipSeed;

    if (isIfEmpty) {
      const [existingTables] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
      if (existingTables.length > 0) {
        console.log(`\n[AUTO-INIT] Database '${connConfig.database}' already initialized (${existingTables.length} tables found). Skipping initialization.`);
        await connection.end();
        return;
      }
      console.log(`\n[AUTO-INIT] Database '${connConfig.database}' is empty. Running full schema and seed initialization...`);
    }

    // -------------------------------------------------------------
    // PHASE 0: TEARDOWN (DROP ALL EXISTING OBJECTS SAFELY)
    // -------------------------------------------------------------
    if (runSchemas && !isNoDrop) {
      await cleanDatabase(connection);
    }

    // -------------------------------------------------------------
    // PHASE 1: EXECUTE SCHEMAS IN ORDER
    // -------------------------------------------------------------
    if (runSchemas) {
      console.log("=========================================================");
      console.log(" PHASE 1: Executing Schemas (22 files)");
      console.log("=========================================================");

      const execOrderCandidates = [
        path.join(baseDbDir, "execution_order.txt"),
        path.join(schemaDir, "execution_order.txt"),
      ];
      const execOrderFile = execOrderCandidates.find((f) => fs.existsSync(f));

      let schemaFiles = [];
      if (execOrderFile) {
        const lines = fs.readFileSync(execOrderFile, "utf-8").split(/\r?\n/);
        for (const line of lines) {
          const match = line.match(/\b([A-Za-z0-9_]+\.sql)\b/i);
          if (match && !schemaFiles.includes(match[1])) {
            schemaFiles.push(match[1]);
          }
        }
      }

      if (schemaFiles.length === 0) {
        schemaFiles = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".sql"));
      }

      for (let i = 0; i < schemaFiles.length; i++) {
        const file = schemaFiles[i];
        const filePath = path.join(schemaDir, file);
        if (!fs.existsSync(filePath)) {
          console.warn(`[SKIP] Missing file: ${file}`);
          continue;
        }
        process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${schemaFiles.length}] Schema: ${file}... `);
        const sql = sanitizeSql(fs.readFileSync(filePath, "utf-8"));
        await connection.query(sql);
        console.log("OK");
      }
      console.log(`Phase 1 Complete: ${schemaFiles.length} schema files executed.\n`);
    }

    // -------------------------------------------------------------
    // PHASE 2: EXECUTE STORED PROCEDURES
    // -------------------------------------------------------------
    if (runProcs) {
      console.log("=========================================================");
      console.log(" PHASE 2: Executing Stored Procedures (26 files)");
      console.log("=========================================================");

      const allDiscovered = getSqlFilesRecursively(proceduresDir);
      const orderedProcFiles = [];

      // Add preferred ordered files first
      for (const rel of PREFERRED_PROC_ORDER) {
        const full = path.join(proceduresDir, rel);
        if (fs.existsSync(full)) {
          orderedProcFiles.push(full);
        }
      }

      // Add any remaining procedures not explicitly listed in preferred order
      for (const discovered of allDiscovered) {
        if (!orderedProcFiles.includes(discovered)) {
          orderedProcFiles.push(discovered);
        }
      }

      let procCount = 0;
      for (let i = 0; i < orderedProcFiles.length; i++) {
        const filePath = orderedProcFiles[i];
        const relPath = path.relative(proceduresDir, filePath);
        process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${orderedProcFiles.length}] SP: ${relPath}... `);
        const content = fs.readFileSync(filePath, "utf-8");
        const stmts = parseSqlStatements(content);
        for (const stmt of stmts) {
          await connection.query(stmt);
          procCount++;
        }
        console.log(`OK (${stmts.length} stmt${stmts.length > 1 ? "s" : ""})`);
      }
      console.log(`Phase 2 Complete: ${orderedProcFiles.length} procedure files (${procCount} statements) executed.\n`);
    }

    // -------------------------------------------------------------
    // PHASE 3: EXECUTE SCHEDULED EVENTS
    // -------------------------------------------------------------
    if (runEvents) {
      console.log("=========================================================");
      console.log(" PHASE 3: Executing Scheduled Events (1 file)");
      console.log("=========================================================");

      const eventFiles = fs.existsSync(eventsDir)
        ? fs.readdirSync(eventsDir).filter((f) => f.endsWith(".sql"))
        : [];

      for (const file of eventFiles) {
        process.stdout.write(`Event: ${file}... `);
        const content = fs.readFileSync(path.join(eventsDir, file), "utf-8");
        const stmts = parseSqlStatements(content);
        for (const stmt of stmts) {
          await connection.query(stmt);
        }
        console.log("OK");
      }
      console.log(`Phase 3 Complete: ${eventFiles.length} event files executed.\n`);
    }

    // -------------------------------------------------------------
    // PHASE 4: EXECUTE SEED DATA
    // -------------------------------------------------------------
    if (runSeeds) {
      console.log("=========================================================");
      console.log(" PHASE 4: Executing Seed Data (4 files)");
      console.log("=========================================================");

      const seedFiles = [
        "SEED_STATUS.sql",
        "SEED_AUTONO.sql",
        "SEED_DATA.sql",
        "SEED_HOLIDAYS.sql",
      ];

      for (let i = 0; i < seedFiles.length; i++) {
        const file = seedFiles[i];
        const filePath = path.join(seedDir, file);
        if (!fs.existsSync(filePath)) {
          console.warn(`[SKIP] Missing seed file: ${file}`);
          continue;
        }
        process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${seedFiles.length}] Seed: ${file}... `);
        const sql = sanitizeSql(fs.readFileSync(filePath, "utf-8"));
        await connection.query(sql);
        console.log("OK");
      }
      console.log(`Phase 4 Complete: ${seedFiles.length} seed files executed.\n`);
    }

    // Print summary verification
    await printVerification(connection);

    console.log("=========================================================");
    console.log(" DATABASE DEPLOYMENT COMPLETED SUCCESSFULLY!             ");
    console.log("=========================================================\n");
  } catch (err) {
    console.error("\n[ERROR] Database execution halted:", err.message);
    if (err.sql) {
      console.error("Failing SQL snippet:\n", err.sql.slice(0, 300));
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

async function printVerification(conn) {
  console.log("=========================================================");
  console.log(" VERIFICATION & INVENTORY CHECK                          ");
  console.log("=========================================================");

  try {
    const [tables] = await conn.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const [views] = await conn.query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
    const [procs] = await conn.query(
      "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE'"
    );
    const [events] = await conn.query(
      "SELECT EVENT_NAME FROM INFORMATION_SCHEMA.EVENTS WHERE EVENT_SCHEMA = DATABASE()"
    );

    console.log(`- Base Tables:          ${tables.length}`);
    console.log(`- Compatibility Views:  ${views.length}`);
    console.log(`- Stored Procedures:    ${procs.length}`);
    console.log(`- Scheduled Events:     ${events.length}`);

    // Quick seed counts
    try {
      const [u] = await conn.query("SELECT COUNT(*) AS c FROM CMS_USER");
      const [s] = await conn.query("SELECT COUNT(*) AS c FROM CMS_STATUS");
      const [h] = await conn.query("SELECT COUNT(*) AS c FROM CMS_HOLIDAY");
      const [m] = await conn.query("SELECT COUNT(*) AS c FROM CMS_MENUITEM");
      console.log(`- Seed Records:         ${u[0].c} users, ${s[0].c} statuses, ${h[0].c} holidays, ${m[0].c} menu items`);
    } catch {
      // Tables might not exist if only running procedures
    }
    console.log("");
  } catch (e) {
    console.warn("Verification check skipped or failed:", e.message);
  }
}

run();
