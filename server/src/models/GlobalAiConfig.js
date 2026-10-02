/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

import mongoose from "mongoose";

const globalAiConfigSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: "singleton", // Enforces a single document store
        },
        // --- Tokens & Usage Limits ---
        global_pro_pool_limit: { 
            type: Number, 
            default: 500000 
        },
        global_user_weekly_limit: { 
            type: Number, 
            default: 100000 
        },
        global_image_weekly_limit: { 
            type: Number, 
            default: 20 
        },
        // --- Access Controls ---
        global_ai_blocked: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.GlobalAiConfig || mongoose.model("GlobalAiConfig", globalAiConfigSchema);
