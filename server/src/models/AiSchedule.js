// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import mongoose from 'mongoose';

const aiScheduleSchema = new mongoose.Schema({
  user_email: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization_id: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  summary: { type: String },
  action_info: { type: String },
  scheduled_at: { type: Date, required: true },
  email_subject: { type: String },
  email_body: { type: String },
  whatsapp_phone_number: { type: String },
  whatsapp_message: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  sent_at: { type: Date },
  error_message: { type: String },
  reschedule_history: [{
    previous_date: Date,
    rescheduled_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const AiSchedule = mongoose.model('AiSchedule', aiScheduleSchema);

export default AiSchedule;
