// data/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/content-ad';

/**
 * Connect to MongoDB
 */
export async function connectDb() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}

// Optional: close connection gracefully
export async function disconnectDb() {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected');
  } catch (err) {
    console.error('❌ Error disconnecting MongoDB:', err);
  }
}
