// server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.js';
import brandRoutes from './routes/brands.js';
import projectRoutes from './routes/projects.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ================== Middleware ==================
app.use(cors({
  origin: '*', // In production, restrict this to your domain
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================== Uploads Directory ==================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ================== Static Files ==================
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

// ================== API Routes ==================
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/projects', projectRoutes);

// ================== Health Check ==================
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ================== Frontend Fallback ==================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================== Error Handler ==================
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ================== MongoDB Connection ==================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/content-ad';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// ================== Start Server ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📂 Frontend: /public`);
  console.log(`📂 Uploads: /uploads`);
});
