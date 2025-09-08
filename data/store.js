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
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse db.json, starting fresh', err);
    return { users: [], brands: [], projects: [], otps: [] };
  }
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

// Getters to always return live arrays
export function getUsers() {
  return db.users;
}
export function getBrands() {
  return db.brands;
}
export function getProjects() {
  return db.projects;
}
export function getOtps() {
  return db.otps;
}

// Allow adding new entities easily
export function addUser(user) {
  db.users.push(user);
  saveDb();
}
export function addBrand(brand) {
  db.brands.push(brand);
  saveDb();
}
export function addProject(project) {
  db.projects.push(project);
  saveDb();
}
export function addOtp(otp) {
  db.otps.push(otp);
  saveDb();
}
