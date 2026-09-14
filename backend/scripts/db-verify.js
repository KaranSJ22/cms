import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function verifyDatabase() {
  const args = process.argv.slice(2);
  let customHost = null;
  let customPort = null;
  let customUser = null;
  let customPassword = null;
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

  const useSsl = customSsl !== null ? customSsl === "true" : process.env.DB_SSL === "true";

  const conn = await mysql.createConnection({
    host: customHost || process.env.DB_HOST || "127.0.0.1",
    port: customPort ? Number(customPort) : (Number(process.env.DB_PORT) || 3306),
    user: customUser || process.env.DB_USER || "cms_app",
    password: customPassword !== null ? customPassword : (process.env.DB_PASSWORD || "StrongPassword@123"),
    database: customDb || process.env.DB_NAME || "CMS_DB",
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  console.log("\n=======================================================");
  console.log(` Connected to '${conn.config.database}' on ${conn.config.host}`);
  console.log("=======================================================\n");

  // 1. Check Tables
  const [tables] = await conn.query("SHOW TABLES");
  const tableKey = Object.keys(tables[0] || {})[0] || "Tables";
  console.log(`Total Tables: ${tables.length}`);
  const tableNames = tables.map((t) => t[tableKey]);
  console.log(tableNames.join(", "));

  // 2. Check Stored Procedures
  const [procs] = await conn.query(
    "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() ORDER BY ROUTINE_NAME"
  );
  console.log(`\nTotal Stored Procedures: ${procs.length}`);

  // 3. Check Seed Data Counts
  console.log("\n--- Data Verification ---");
  const [userCount] = await conn.query("SELECT COUNT(*) AS count FROM CMS_USER");
  const [statusCount] = await conn.query("SELECT COUNT(*) AS count FROM CMS_STATUS");
  const [holidayCount] = await conn.query("SELECT COUNT(*) AS count FROM CMS_HOLIDAY");
  const [canteenCount] = await conn.query("SELECT COUNT(*) AS count FROM CMS_CANTEEN");
  const [itemCount] = await conn.query("SELECT COUNT(*) AS count FROM CMS_MENUITEM");
  const [walletCount] = await conn.query("SELECT COUNT(*) AS count FROM CMS_WALLET");

  console.table([
    { Entity: "Users (CMS_USER)", Records: userCount[0].count },
    { Entity: "Statuses (CMS_STATUS)", Records: statusCount[0].count },
    { Entity: "Holidays (CMS_HOLIDAY)", Records: holidayCount[0].count },
    { Entity: "Canteens (CMS_CANTEEN)", Records: canteenCount[0].count },
    { Entity: "Menu Items (CMS_MENUITEM)", Records: itemCount[0].count },
    { Entity: "Wallets (CMS_WALLET)", Records: walletCount[0].count },
  ]);

  // 4. Sample Users
  const [sampleUsers] = await conn.query(
    "SELECT USERID, LOGINID, FULLNAME, ISACTIVE FROM CMS_USER LIMIT 5"
  );
  console.log("\n--- Sample Users in Database ---");
  console.table(sampleUsers);

  await conn.end();
  console.log("\nAll checks passed!\n");
}

verifyDatabase().catch((err) => {
  console.error("Verification failed:", err.message);
  process.exit(1);
});
