/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const notificationTemplateSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            unique: true, 
            trim: true 
        },
        type: { 
            type: String, 
            enum: ["EMAIL", "SMS"], 
            required: true 
        },
        category: { 
            type: String, 
            enum: ["PAYMENT", "ADMISSION", "SAAS", "SYSTEM"], 
            required: true 
        },
        subject: { 
            type: String, 
            required: function() { return this.type === 'EMAIL'; } 
        },
        htmlBody: { 
            type: String, 
            required: function() { return this.type === 'EMAIL'; } 
        },
        textBody: { 
            type: String,
            required: function() { return this.type === 'SMS'; }
        },
        fromEmail: {
            type: String
        },
        fromName: {
            type: String
        },
        requiredPlaceholders: { 
            type: [String], 
            default: [] 
        },
        description: { 
            type: String 
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
        createdBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        },
        updatedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }
    },
    { timestamps: true }
);

const NotificationTemplate = mongoose.model("NotificationTemplate", notificationTemplateSchema);

export default NotificationTemplate;
