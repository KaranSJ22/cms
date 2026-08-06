import fs from 'fs';
import mysql from 'mysql2/promise';

async function runSeeds() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'cms_app',
    password: 'StrongPassword@123',
    database: 'CMS_DB',
    multipleStatements: true
  });

  const seedFiles = [
    '../../database/seed/V1/00_SEED_COMMON.sql',
    '../../database/seed/V1/01_SEED_IDENTITY_ACCESS.sql',
    '../../database/seed/V1/02_SEED_MENU_SERVICE.sql',
    '../../database/seed/V1/03_SEED_BOOKINGS.sql'
  ];

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Optional: Clear tables if we want a fresh seed, but user says "CURRENTLY DATABASE HAS NO DATA", so insert should be fine.
    // If they already ran some, it might throw duplicate entry. 
    // We'll just run them.

    for (const file of seedFiles) {
      console.log(`Executing ${file}...`);
      let sql = fs.readFileSync(file, 'utf8');
      sql = sql.replace(/INSERT INTO/g, 'INSERT IGNORE INTO');
      await connection.query(sql);
      console.log(`${file} executed successfully.`);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('All seed files executed successfully!');
  } catch (error) {
    console.error('Error executing seed files:', error);
  } finally {
    await connection.end();
  }
}

runSeeds();
