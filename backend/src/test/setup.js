import { beforeAll, afterAll } from "vitest";
import bcrypt from "bcrypt";
import { pool } from "../db/connection.js";

// Ensure seed users have a valid bcrypt hash for 'admin123' before running tests
beforeAll(async () => {
  const hash = await bcrypt.hash("admin123", 10);
  await pool.query(
    `UPDATE CMS_USER 
     SET PWDHASH = ? 
     WHERE LOGINID IN (
       'admin', 'mgr1', 'mgr2', 'asst1', 'asst2', 
       'staff1', 'staff2', 'staff3', 
       'perm1', 'perm2', 'perm3', 'perm4', 'perm5', 'perm6', 'perm7', 
       'cont1', 'cont2', 'cont3', 'cont4', 'cont5', 
       'oce1', 'oce2', 'vis1'
     )`,
    [hash]
  );

  // Ensure user 1 (admin) has SYSADM role (roleid 1) in CMS_USERROLE
  await pool.query(
    `INSERT INTO CMS_USERROLE (USERID, ROLEID, ISACTIVE)
     VALUES (1, 1, 1)
     ON DUPLICATE KEY UPDATE ISACTIVE = 1`
  );

  // Ensure CMSLISTAUTONO has corrected column aliases (STATUSID AS STATUS)
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSLISTAUTONO`);
    await pool.query(`
      CREATE PROCEDURE CMSLISTAUTONO ()
      BEGIN
          SELECT AUTONOID, TBLNAME, DATAITEM, ITEMLEN, FLDTYPE,
                 PREFIXCHAR, STARTNO, STARTDATE, LASTNO, STATUSID AS STATUS, STATUSID,
                 CREATEDBY, CREATEDAT, UPDATEDAT
          FROM   CMS_AUTONOS
          ORDER BY TBLNAME, DATAITEM;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }
});

// Ensure MySQL connection pool is cleanly closed after tests finish
afterAll(async () => {
  try {
    await pool.end();
  } catch (err) {
    // Ignore if already ended
  }
});
