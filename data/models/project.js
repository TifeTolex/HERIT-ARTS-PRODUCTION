// data/models/Project.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const FileSchema = new Schema({
  url: String,
  originalName: String,
  uploadedBy: { type: String, enum: ['brand', 'staff'], default: 'brand' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const ProjectSchema = new Schema({
  externalId: { type: String, index: true }, // previous id used in user.brand.projects
  name: { type: String, required: true },
  brief: { type: String },
  requirements: { type: String },
  brand: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // owner
  brandName: { type: String },
  brandEmail: { type: String },
  assignee: { type: String }, // staff email or id
  status: { type: String, enum: ['Pending','In Progress','Delivered','Completed'], default: 'Pending' },
  files: [FileSchema],
  createdAt: { type: Date, default: Date.now },
  deadline: Date,
  deliveredAt: Date,
  metadata: Schema.Types.Mixed // extra fields (keeps compatibility)
}, { timestamps: true });

export default model('Project', ProjectSchema);
