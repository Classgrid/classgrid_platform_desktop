import mongoose from 'mongoose';

const artifactSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  stepId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Ensure one artifact per step per session
artifactSchema.index({ sessionId: 1, stepId: 1 }, { unique: true });

export default mongoose.models.Artifact || mongoose.model('Artifact', artifactSchema);
