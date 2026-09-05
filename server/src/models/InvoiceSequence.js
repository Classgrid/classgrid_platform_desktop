/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import mongoose from "mongoose";

const invoiceSequenceSchema = new mongoose.Schema(
    {
        financialYear: {
            type: String, // e.g. "2026-2027"
            required: true,
            unique: true,
        },
        currentNumber: {
            type: Number,
            default: 0,
        },
        prefix: {
            type: String,
            default: "CG-INV-",
        }
    },
    {
        timestamps: true,
    }
);

// Method to atomically get the next invoice number
invoiceSequenceSchema.statics.getNextNumber = async function (financialYear, prefix = "CG-INV-") {
    const sequence = await this.findOneAndUpdate(
        { financialYear },
        { $inc: { currentNumber: 1 }, $setOnInsert: { prefix } },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );
    return `${sequence.prefix}${financialYear}-${sequence.currentNumber.toString().padStart(5, '0')}`;
};

export default mongoose.models.InvoiceSequence || mongoose.model("InvoiceSequence", invoiceSequenceSchema);
