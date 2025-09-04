import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'db.json');

// Load JSON file
function load() {
  if (!fs.existsSync(dbPath)) {
    return { users: [], brands: [], projects: [], otps: [] };
  }
  const raw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(raw);
}

// Save JSON file
function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Load database into memory
let db = load();

// Helpers
export function getDb() {
  return db;
}

export function saveDb() {
  save(db);
}

// Shortcuts (used in routes)
export const users = db.users || [];
export const brands = db.brands || [];
export const projects = db.projects || [];
export const otps = db.otps || [];
