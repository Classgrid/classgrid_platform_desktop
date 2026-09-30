// MODEL STATUS:
// - Cloudflare Workers AI = ACTIVE (now in use)
// - Gemini 3.5 Flash = COMMENTED OUT (disabled)
// - Groq model = DEAD (removed from use)
import mongoose from 'mongoose';

const userStorageQuotaSchema = new mongoose.Schema({
  user_email: { type: String, unique: true, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  used_bytes: { type: Number, default: 0 },
  max_bytes: { type: Number, default: 629145600 }, // 600MB
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model('UserStorageQuota', userStorageQuotaSchema);
