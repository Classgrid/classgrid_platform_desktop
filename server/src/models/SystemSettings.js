/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema({
    maintenanceMode: { type: Boolean, default: false },
    disableRegistrations: { type: Boolean, default: false },
    globalLock: { type: Boolean, default: false },
    aiFeatures: { type: Boolean, default: true },
    notesSystem: { type: Boolean, default: true },
    chatSystem: { type: Boolean, default: true }
}, { timestamps: true });

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings;
