import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
    {
        organizationId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Organization",
            required: true
        },
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User",
            required: false // May be null if sent to a parent/guest without a formal user ID
        },
        templateId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "NotificationTemplate"
        },
        type: { 
            type: String, 
            enum: ["EMAIL", "SMS"], 
            required: true 
        },
        recipient: { 
            type: String, 
            required: true 
        },
        status: { 
            type: String, 
            enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "BOUNCED", "COMPLAINED"],
            default: "PENDING"
        },
        providerMessageId: { 
            type: String 
        },
        failureReason: { 
            type: String 
        },
        metadata: { 
            type: mongoose.Schema.Types.Mixed 
        },
        idempotencyKey: {
            type: String,
            unique: true,
            sparse: true
        },
        retryCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Indexes for fast querying in the super admin dashboard
notificationLogSchema.index({ idempotencyKey: 1 });
notificationLogSchema.index({ organizationId: 1, createdAt: -1 });
notificationLogSchema.index({ status: 1 });
notificationLogSchema.index({ recipient: 1 });

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);

export default NotificationLog;
