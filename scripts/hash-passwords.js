// scripts/hash-passwords.js
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

async function main() {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('db.json not found at', dbPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);
  let changed = false;

  for (const user of db.users || []) {
    if (!user.password) continue;
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      // already bcrypt-hashed
      continue;
    }
    const hash = await bcrypt.hash(user.password, 10);
    user.password = hash;
    changed = true;
    console.log(`Hashed password for ${user.email}`);
  }

  if (changed) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('✅ Updated db.json with hashed passwords');
  } else {
    console.log('No plaintext passwords found, nothing changed.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
