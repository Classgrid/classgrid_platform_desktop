import mongoose from 'mongoose';

const aiScheduleSchema = new mongoose.Schema({
  user_email: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization_id: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  scheduled_at: { type: Date, required: true },
  email_subject: { type: String, required: true },
  email_body: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  sent_at: { type: Date },
  error_message: { type: String }
}, { timestamps: true });

const AiSchedule = mongoose.model('AiSchedule', aiScheduleSchema);

export default AiSchedule;
