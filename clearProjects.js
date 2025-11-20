import mongoose from 'mongoose';
import User from './data/models/User.js'; // adjust path if needed

// Replace with your MongoDB URI
const MONGO_URI = 'mongodb://localhost:27017/your-db-name';

async function clearProjects() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const users = await User.find({ 'brand.projects.0': { $exists: true } });
    console.log(`Found ${users.length} users with projects.`);

    for (const user of users) {
      user.brand.projects = []; // clear all projects
      await user.save();
      console.log(`Cleared projects for user ${user.email}`);
    }

    console.log('All projects cleared successfully!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error clearing projects:', err);
    mongoose.disconnect();
  }
}

clearProjects();
