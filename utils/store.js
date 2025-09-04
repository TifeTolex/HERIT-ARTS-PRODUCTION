import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'db.json');

function ensureDB() {
  // make sure data folder exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  // make sure db.json exists
  if (!fs.existsSync(dbFile)) {
    const initialData = { users: [], brands: [], projects: [] };
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
  }
}

export function loadDB() {
  ensureDB();
  const raw = fs.readFileSync(dbFile, 'utf-8');
  return JSON.parse(raw);
}

export function saveDB(data) {
  ensureDB();
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}
