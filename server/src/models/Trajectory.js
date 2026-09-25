import mongoose from 'mongoose';

const trajectorySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  projectName: {
    type: String,
    required: true,
  },
  plan: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending' },
    error: { type: String },
  }],
  currentIndex: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'aborted', 'failed'],
    default: 'running',
  },
  abortReason: {
    type: String,
  }
}, { timestamps: true });

export default mongoose.models.Trajectory || mongoose.model('Trajectory', trajectorySchema);
