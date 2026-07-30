import mongoose from "mongoose";

const invoiceLineItemSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        planVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingPlanVersion",
            default: null,
        },
        moduleVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BillingModuleVersion",
            default: null,
        },
        servicePeriodStart: {
            type: Date,
            default: null,
        },
        servicePeriodEnd: {
            type: Date,
            default: null,
        },
        quantity: {
            type: Number,
            default: 1,
        },
        unitPricePaise: {
            type: Number,
            default: 0,
        },
        subtotalPaise: {
            type: Number,
            default: 0,
        },
        discountAmountPaise: {
            type: Number,
            default: 0,
        },
        taxRatePercentage: {
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
    },
    {
        timestamps: true,
    }
);

invoiceLineItemSchema.index({ invoiceId: 1 });

export default mongoose.models.InvoiceLineItem || mongoose.model("InvoiceLineItem", invoiceLineItemSchema);
