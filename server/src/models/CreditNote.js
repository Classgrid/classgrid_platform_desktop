import mongoose from "mongoose";

const creditNoteSchema = new mongoose.Schema(
    {
        creditNoteNumber: {
            type: String,
            required: true,
            unique: true,
        },
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
        issueDate: {
            type: Date,
            default: Date.now,
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["DRAFT", "ISSUED", "APPLIED"],
            default: "DRAFT",
        },
        subtotalPaise: {
            type: Number,
            default: 0,
        },
        taxAmountPaise: {
            type: Number,
            default: 0,
        },
        totalAmountPaise: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true,
    }
);

creditNoteSchema.index({ invoiceId: 1 });

export default mongoose.models.CreditNote || mongoose.model("CreditNote", creditNoteSchema);
