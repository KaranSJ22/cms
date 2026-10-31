import { pool } from "../src/db/connection.js";

async function main() {
  console.log("Mapping physical RFID cards to employees in MySQL database...");

  // 1. Map physical card F317DC13 to Permanent Employee P001 (CustomerID 1)
  await pool.query(`
    INSERT INTO CMS_ACCKEY (CUSTOMERID, KEYTYPE, KEYVALUE, STATUSID)
    VALUES (1, 'RFID', 'F317DC13', 10)
    ON DUPLICATE KEY UPDATE KEYVALUE = 'F317DC13', STATUSID = 10, UPDATEDAT = NOW()
  `);
  console.log("Mapped F317DC13 -> Customer ID 1 (Perm Emp 1 / P001)");

  // 2. Map physical card ED85D128 to Contract Employee C001 (CustomerID 8)
  await pool.query(`
    INSERT INTO CMS_ACCKEY (CUSTOMERID, KEYTYPE, KEYVALUE, STATUSID)
    VALUES (8, 'RFID', 'ED85D128', 10)
    ON DUPLICATE KEY UPDATE KEYVALUE = 'ED85D128', STATUSID = 10, UPDATEDAT = NOW()
  `);
  console.log("Mapped ED85D128 -> Customer ID 8 (Cont Emp 1 / C001)");

  // 3. Top up wallet balance for Contract Employee C001 (CustomerID 8) to 500.00
  await pool.query(`
    UPDATE CMS_WALLET 
    SET BALANCE = 500.00 
    WHERE CUSTOMERID = 8
  `);
  console.log("Topped up wallet balance for Customer ID 8 to Rs. 500.00");

  // 4. Verify mappings
  const [rows] = await pool.query(`
    SELECT 
      c.CUSTOMERID AS customerId,
      c.DISPNAME AS dispName,
      ak.KEYVALUE AS rfidUid,
      COALESCE(pe.EMPCODE, ce.CONTCODE, CAST(c.CUSTOMERID AS CHAR)) AS empCode,
      COALESCE(w.BALANCE, 0.00) AS walletBalance
    FROM CMS_ACCKEY ak
    JOIN CMS_CUSTOMER c ON c.CUSTOMERID = ak.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
    LEFT JOIN CMS_CONTEMP ce ON ce.CUSTOMERID = c.CUSTOMERID
    LEFT JOIN CMS_WALLET w ON w.CUSTOMERID = c.CUSTOMERID
    WHERE ak.KEYVALUE IN ('F317DC13', 'ED85D128')
  `);

  console.table(rows);
  console.log("RFID Card mapping completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to map RFID cards:", err);
  process.exit(1);
});
