// scripts/migrate-projects.js
import mongoose from 'mongoose';
import User from "../data/models/User.js";
import Project from "../data/models/project.js";

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/yourdb';

async function migrate() {
  try {
    await mongoose.connect(MONGO);
    console.log("Connected to MongoDB");

    const users = await User.find({ 'brand.projects.0': { $exists: true } });
    console.log('Users with embedded projects:', users.length);

    for (const u of users) {
      if (!u.brand || !u.brand.projects) continue;

      for (const p of u.brand.projects) {
        const exists = await Project.findOne({ externalId: p.id });
        if (exists) continue;

        const doc = {
          externalId: p.id,
          name: p.name || p.projectName || 'Untitled',
          brief: p.brief || p.description || '',
          requirements: p.requirements || '',
          brand: u._id,
          brandName: u.brand.businessName || u.brand.name || '',
          brandEmail: u.email,
          status: p.status || 'Pending',
          createdAt: p.createdAt || new Date(),
          deadline: p.deadline ? new Date(p.deadline) : undefined,
          files: p.files || [],
          metadata: p.metadata || {}
        };

        await Project.create(doc);
        console.log(`Migrated project ${p.id} for user ${u.email}`);
      }
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
