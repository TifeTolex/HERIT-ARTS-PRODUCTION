import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'db.json');

// ------------------ Internal Load/Save ------------------
function load() {
  if (!fs.existsSync(dbPath)) {
    return { users: [], brands: [], projects: [], otps: [] };
  }
  const raw = fs.readFileSync(dbPath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse db.json, starting fresh', err);
    return { users: [], brands: [], projects: [], otps: [] };
  }
}

function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ------------------ DB in memory ------------------
let db = load();

// ------------------ Helpers ------------------
export function getDb() {
  return db;
}

export function saveDb() {
  save(db);
}

// ------------------ Getters ------------------
export function getUsers() {
  return db.users || [];
}

export function getBrands() {
  return db.brands || [];
}

export function getProjects() {
  return db.projects || [];
}

export function getOtps() {
  return db.otps || [];
}

// ------------------ Adders ------------------
export function addUser(user) {
  if (!db.users) db.users = [];
  db.users.push(user);
  saveDb(); // ✅ always persist immediately
}

export function addBrand(brand) {
  if (!db.brands) db.brands = [];
  db.brands.push(brand);
  saveDb();
}

export function addProject(project) {
  if (!db.projects) db.projects = [];
  db.projects.push(project);
  saveDb();
}

export function addOtp(otp) {
  if (!db.otps) db.otps = [];
  db.otps.push(otp);
  saveDb();
}
