// reset-db.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'db.json');

// Load current DB
const raw = fs.readFileSync(dbPath, 'utf-8');
const db = JSON.parse(raw);

// Keep only staff users (or none if you want a fully clean slate)
db.users = db.users.filter(u => u.role === 'staff');

// Optionally reset brands/projects too
db.brands = [];
db.projects = [];
db.otps = [];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('✅ db.json has been reset (staff users kept, everything else cleared).');
