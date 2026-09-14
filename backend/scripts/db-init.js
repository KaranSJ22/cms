import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const schemaDir = path.resolve(__dirname, "../../database/schema");
const proceduresDir = path.resolve(__dirname, "../../database/procedures");
const seedDir = path.resolve(__dirname, "../../database/seed");
const execOrderFile = path.join(schemaDir, "execution_order.txt");

/**
 * Strips `USE db_name;` statements so scripts execute in whatever database
 * the connection is bound to (e.g., Aiven defaultdb, CMS_DB, etc.)
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

    const delimiterMatch = trimmedLine.match(/^DELIMITER\s+(\S+)/i);
    if (delimiterMatch) {
      if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      }
      currentDelimiter = delimiterMatch[1];
      continue;
    }

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
    const finalStmt = currentStatement.trim().replace(new RegExp(`${currentDelimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`), "");
    if (finalStmt.length > 0) {
      statements.push(finalStmt);
    }
  }

  return statements.filter((s) => s.length > 0);
}

async function run() {
  console.log("=========================================================");
  console.log(" ISRO CMS — 1-Click Complete Database Initializer       ");
  console.log(" (Schemas -> Stored Procedures -> Seed Data)            ");
  console.log("=========================================================\n");

  const args = process.argv.slice(2);
  let customUser = null;
  let customPassword = null;
  let customHost = null;
  let customPort = null;
  let customDb = null;
  let customSsl = null;

  for (const arg of args) {
    if (arg.startsWith("--user=") || arg.startsWith("-u=")) customUser = arg.split("=")[1];
    else if (arg.startsWith("--password=") || arg.startsWith("-p=")) customPassword = arg.split("=")[1];
    else if (arg.startsWith("--host=") || arg.startsWith("-h=")) customHost = arg.split("=")[1];
    else if (arg.startsWith("--port=") || arg.startsWith("-P=")) customPort = arg.split("=")[1];
    else if (arg.startsWith("--database=") || arg.startsWith("-d=")) customDb = arg.split("=")[1];
    else if (arg.startsWith("--ssl=")) customSsl = arg.split("=")[1];
  }

  const useSsl = customSsl !== null ? customSsl === "true" : process.env.DB_SSL === "true";

  const connConfig = {
    host: customHost || process.env.DB_HOST || "127.0.0.1",
    port: customPort ? Number(customPort) : (Number(process.env.DB_PORT) || 3306),
    user: customUser || process.env.DB_USER || "cms_app",
    password: customPassword !== null ? customPassword : (process.env.DB_PASSWORD || "StrongPassword@123"),
    database: customDb || process.env.DB_NAME || "CMS_DB",
    multipleStatements: true,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };

  console.log(`Connecting to '${connConfig.database}' on ${connConfig.host}:${connConfig.port} (SSL: ${useSsl ? "ON" : "OFF"})...`);
  let connection;
  try {
    connection = await mysql.createConnection(connConfig);
    console.log("Connected successfully!\n");
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }

  try {
    // -------------------------------------------------------------
    // PHASE 1: EXECUTE SCHEMAS IN ORDER
    // -------------------------------------------------------------
    console.log("--- PHASE 1: Creating Schema Tables ---");
    let schemaFiles = [];
    if (fs.existsSync(execOrderFile)) {
      const lines = fs.readFileSync(execOrderFile, "utf-8").split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^([A-Za-z0-9_]+\.sql)/);
        if (match) schemaFiles.push(match[1]);
      }
    }

    if (schemaFiles.length === 0) {
      schemaFiles = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".sql"));
    }

    for (const file of schemaFiles) {
      const filePath = path.join(schemaDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Skipping missing schema file: ${file}`);
        continue;
      }
      process.stdout.write(`Executing schema ${file}... `);
      const sql = sanitizeSql(fs.readFileSync(filePath, "utf-8"));
      await connection.query(sql);
      console.log("OK");
    }
    console.log(`Completed ${schemaFiles.length} schema files.\n`);

    // -------------------------------------------------------------
    // PHASE 2: SYNC STORED PROCEDURES
    // -------------------------------------------------------------
    console.log("--- PHASE 2: Syncing Stored Procedures ---");
    const procFiles = fs.readdirSync(proceduresDir).filter((f) => f.endsWith(".sql"));
    let procCount = 0;
    for (const file of procFiles) {
      process.stdout.write(`Syncing procedures in ${file}... `);
      const content = fs.readFileSync(path.join(proceduresDir, file), "utf-8");
      const stmts = parseSqlStatements(content);
      for (const stmt of stmts) {
        await connection.query(stmt);
        procCount++;
      }
      console.log("OK");
    }
    console.log(`Synced ${procFiles.length} procedure files (${procCount} statements).\n`);

    // -------------------------------------------------------------
    // PHASE 3: EXECUTE SEED DATA
    // -------------------------------------------------------------
    console.log("--- PHASE 3: Loading Seed Data ---");
    const seedFiles = [
      "SEED_STATUS.sql",
      "SEED_AUTONO.sql",
      "SEED_DATA.sql",
      "SEED_HOLIDAYS.sql",
    ];

    for (const file of seedFiles) {
      const filePath = path.join(seedDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Skipping missing seed file: ${file}`);
        continue;
      }
      process.stdout.write(`Loading seed ${file}... `);
      const sql = sanitizeSql(fs.readFileSync(filePath, "utf-8"));
      await connection.query(sql);
      console.log("OK");
    }
    console.log(`Completed seed data insertion.\n`);

    console.log("=========================================================");
    console.log(" Database initialization SUCCESSFUL!                     ");
    console.log(" Tables, Stored Procedures, and Seed Data are all loaded.");
    console.log("=========================================================");
  } catch (err) {
    console.error("\nDatabase initialization encountered an error:", err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

run();
