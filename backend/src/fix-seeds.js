

import fs from 'fs';
import mysql from 'mysql2/promise';
const path = require('path');

const dir = 'e:/CMS/Code/cms/database/seed/V1';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/INSERT INTO/g, 'INSERT IGNORE INTO');
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
