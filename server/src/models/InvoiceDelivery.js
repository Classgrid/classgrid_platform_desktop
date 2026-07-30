import mongoose from "mongoose";

const invoiceDeliverySchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        deliveryEvent: {
            type: String,
            enum: ["EMAIL_SENT", "EMAIL_FAILED", "DOWNLOADED", "REMINDER_SENT"],
            required: true,
        },
        emailSentTo: {
            type: String,
            default: null,
        },
        errorDetails: {
            type: String,
            default: null,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Can be null if system generated
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

invoiceDeliverySchema.index({ invoiceId: 1, createdAt: -1 });

export default mongoose.models.InvoiceDelivery || mongoose.model("InvoiceDelivery", invoiceDeliverySchema);
