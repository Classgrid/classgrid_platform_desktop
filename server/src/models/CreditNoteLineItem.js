import mongoose from "mongoose";

const creditNoteLineItemSchema = new mongoose.Schema(
    {
        creditNoteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CreditNote",
            required: true,
        },
        invoiceLineItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InvoiceLineItem",
            default: null,
        },
        description: {
            type: String,
            required: true,
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
        taxAmountPaise: {
            type: Number,
            default: 0,
        },
        totalAmountPaise: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

creditNoteLineItemSchema.index({ creditNoteId: 1 });

export default mongoose.models.CreditNoteLineItem || mongoose.model("CreditNoteLineItem", creditNoteLineItemSchema);
