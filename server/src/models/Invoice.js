import mongoose from "mongoose";
import { INVOICE_STATUS } from "../utils/billing.utils.js";

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        organizationSubscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrganizationSubscription",
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(INVOICE_STATUS),
            default: INVOICE_STATUS.DRAFT,
        },
        issueDate: {
            type: Date,
            default: null,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        servicePeriodStart: {
            type: Date,
            required: true,
        },
        servicePeriodEnd: {
            type: Date,
            required: true,
        },
        
        // Snapshot Financial Totals
        subtotalPaise: {
            type: Number,
            default: 0,
        },
        discountAmountPaise: {
            type: Number,
            default: 0,
        },
        creditAmountAppliedPaise: {
            type: Number,
            default: 0,
        },
        taxableAmountPaise: {
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
        amountPaidPaise: {
            type: Number,
            default: 0,
        },
        amountDuePaise: {
            type: Number,
            default: 0,
        },
        
        // Currency Snapshot
        currency: {
            type: String,
            default: "INR",
        },

        // Immutable lock (ensures we don't accidentally update issued invoices)
        isLocked: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

invoiceSchema.index({ organizationId: 1, status: 1, dueDate: 1 });

invoiceSchema.pre("save", function (next) {
    // If it's already locked and not a status/payment update, block it
    if (!this.isNew && this.isLocked && this.isModified("subtotalPaise")) {
        return next(new Error("Cannot modify financial values of a locked invoice. Use a Credit Note instead."));
    }
    // Lock it automatically if it's issued
    if (this.status !== INVOICE_STATUS.DRAFT) {
        this.isLocked = true;
    }
    next();
});

export default mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
