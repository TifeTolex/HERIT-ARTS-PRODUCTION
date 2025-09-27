// cleanup.js (ESM version)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb } from './data/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data', 'db.json');
const backupPath = path.join(__dirname, 'data', 'db-backup.json');

function backupDb() {
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`📦 Backup created at ${backupPath}`);
  } else {
    console.log('⚠️ No db.json found, nothing to back up.');
  }
}

function cleanupDb() {
  const db = getDb();
  if (!db.users) db.users = [];

  const seenEmails = new Set();
  let removed = 0;
  let fixedRoles = 0;
  let normalizedEmails = 0;

  db.users = db.users.filter(user => {
    if (!user.email) return false;

    const originalEmail = user.email;
    user.email = user.email.trim().toLowerCase();
    if (user.email !== originalEmail) normalizedEmails++;

    if (!user.role) {
      user.role = 'brand';
      fixedRoles++;
    }

    if (seenEmails.has(user.email)) {
      removed++;
      return false;
    }

    seenEmails.add(user.email);
    return true;
  });

  saveDb();

  console.log('✅ DB cleanup complete.');
  console.log(`- Normalized emails: ${normalizedEmails}`);
  console.log(`- Fixed missing roles: ${fixedRoles}`);
  console.log(`- Removed duplicates: ${removed}`);
  console.log('--- User Summary ---');

  console.table(db.users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role
  })));
}

backupDb();
cleanupDb();
