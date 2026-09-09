import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const proceduresDir = path.resolve(__dirname, "../../database/procedures");

/**
 * Splits raw SQL content into executable statements respecting MySQL DELIMITER commands.
 * @param {string} sqlContent 
 * @returns {Array<string>} Array of pure SQL statements to execute
 */
function parseSqlStatements(sqlContent) {
  const statements = [];
  const lines = sqlContent.split(/\r?\n/);
  let currentDelimiter = ";";
  let currentStatement = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for DELIMITER change (e.g., DELIMITER $$ or DELIMITER ;)
    const delimiterMatch = trimmedLine.match(/^DELIMITER\s+(\S+)/i);
    if (delimiterMatch) {
      // Flush any pending statement before changing delimiter
      if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      }
      currentDelimiter = delimiterMatch[1];
      continue;
    }

    // Ignore USE database statements as connection is already bound to CMS_DB
    if (/^USE\s+[\w`]+;/i.test(trimmedLine)) {
      continue;
    }

    currentStatement += line + "\n";

    // Check if statement terminates with the active delimiter
    if (currentDelimiter === ";") {
      // For standard semicolon delimiter, check if line ends with semicolon (ignoring comments)
      if (trimmedLine.endsWith(";")) {
        const stmt = currentStatement.trim().replace(/;$/, "");
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = "";
      }
    } else {
      // For custom delimiters like $$ or //
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

  // Flush any remaining content
  if (currentStatement.trim().length > 0) {
    const finalStmt = currentStatement.trim().replace(new RegExp(`${currentDelimiter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`), "");
    if (finalStmt.length > 0) {
      statements.push(finalStmt);
    }
  }

  return statements.filter((s) => s.length > 0);
}

async function run() {
  console.log("==================================================");
  console.log(" ISRO CMS — Database Stored Procedure Sync Tool   ");
  console.log("==================================================");

  // Parse CLI args (e.g. npm run db:sync -- --user=root --password=secret CMSADDBOOKWEEKLY.sql)
  const args = process.argv.slice(2);
  let customUser = null;
  let customPassword = null;
  let targetArg = null;

  for (const arg of args) {
    if (arg.startsWith("--user=")) {
      customUser = arg.split("=")[1];
    } else if (arg.startsWith("-u=")) {
      customUser = arg.split("=")[1];
    } else if (arg.startsWith("--password=")) {
      customPassword = arg.split("=")[1];
    } else if (arg.startsWith("-p=")) {
      customPassword = arg.split("=")[1];
    } else if (!arg.startsWith("-")) {
      targetArg = arg;
    }
  }

  const connConfig = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: customUser || process.env.DB_USER || "cms_app",
    password: customPassword !== null ? customPassword : (process.env.DB_PASSWORD || "StrongPassword@123"),
    database: process.env.DB_NAME || "CMS_DB",
    multipleStatements: true,
  };

  console.log(`Connecting as user '${connConfig.user}' to database '${connConfig.database}' at ${connConfig.host}:${connConfig.port}...`);
  let connection;
  try {
    connection = await mysql.createConnection(connConfig);
    console.log("Connected successfully!\n");
  } catch (err) {
    console.error("Failed to connect to MySQL database:", err.message);
    process.exit(1);
  }

  try {
    if (!fs.existsSync(proceduresDir)) {
      console.error(`Procedures directory not found: ${proceduresDir}`);
      process.exit(1);
    }

    let files = fs.readdirSync(proceduresDir).filter((f) => f.endsWith(".sql"));

    if (targetArg) {
      const match = files.find(
        (f) => f.toLowerCase() === targetArg.toLowerCase() || f.toLowerCase().includes(targetArg.toLowerCase())
      );
      if (!match) {
        console.error(`Target procedure file not found matching "${targetArg}".`);
        console.log("Available files:", files.join(", "));
        process.exit(1);
      }
      files = [match];
    }

    console.log(`Found ${files.length} SQL procedure file(s) to process.\n`);

    let totalExecuted = 0;
    let failedFiles = [];
    let hadSystemUserError = false;

    for (const file of files) {
      const filePath = path.join(proceduresDir, file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");
      const statements = parseSqlStatements(sqlContent);

      process.stdout.write(`Processing ${file} (${statements.length} statements)... `);

      try {
        for (const stmt of statements) {
          await connection.query(stmt);
          totalExecuted++;
        }
        console.log("OK");
      } catch (err) {
        console.log("FAILED");
        console.error(`  Error in ${file}:`, err.message);
        if (err.message.includes("SYSTEM_USER")) {
          hadSystemUserError = true;
        }
        failedFiles.push({ file, error: err.message });
      }
    }

    console.log("\n==================================================");
    console.log(`Sync Complete: ${totalExecuted} statements executed across ${files.length} files.`);
    if (failedFiles.length > 0) {
      console.log(`Warnings/Failures in ${failedFiles.length} file(s):`);
      for (const f of failedFiles) {
        console.log(` - ${f.file}: ${f.error}`);
      }

      if (hadSystemUserError) {
        console.log("\n--------------------------------------------------");
        console.log("DIAGNOSTIC: 'SYSTEM_USER privilege' Error in MySQL 8.0");
        console.log("--------------------------------------------------");
        console.log("Because these stored procedures were originally created by 'root',");
        console.log("MySQL 8.0 prevents regular user '" + connConfig.user + "' from dropping/altering them.\n");
        console.log("To resolve this, choose one of the following:");
        console.log("Option 1 (Recommended): Run this one-time grant in MySQL Workbench as root:");
        console.log("  GRANT SYSTEM_USER, CREATE ROUTINE, ALTER ROUTINE ON *.* TO '" + connConfig.user + "'@'%';");
        console.log("  GRANT SYSTEM_USER, CREATE ROUTINE, ALTER ROUTINE ON *.* TO '" + connConfig.user + "'@'localhost';");
        console.log("  FLUSH PRIVILEGES;\n");
        console.log("Option 2: Run sync using root credentials directly:");
        console.log("  npm run db:sync -- --user=root --password=YOUR_ROOT_PASSWORD");
        console.log("--------------------------------------------------");
      }
    } else {
      console.log("All procedures deployed cleanly!");
    }
    console.log("==================================================");
  } catch (err) {
    console.error("Unexpected error during sync:", err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();

