/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';

const feeRecordSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
        title: {
            type: String, // e.g., "Exam Fee Oct 2026", "Lab Monthly Charge"
            required: true,
        },
        category: {
            type: String,
            enum: ['college', 'exam', 'library', 'canteen', 'hostel', 'other'],
            default: 'college',
        },
        amountPaise: {
            type: Number,
            required: true,
            min: 0,
            validate: { validator: Number.isInteger, message: "{VALUE} is not an integer paise value" }
        },
        dueDate: {
            type: Date,
            required: true,
        },
        paidAmountPaise: {
            type: Number,
            default: 0,
            min: 0,
            validate: { validator: Number.isInteger, message: "{VALUE} is not an integer paise value" }
        },
        status: {
            type: String,
            enum: ['pending', 'partially_paid', 'paid', 'overdue'],
            default: 'pending',
        },
        paymentReference: String,
        paidAt: Date,
        remarks: String,
    },
    {
        timestamps: true,
    }
);

// Helpful indexes for student and admin dashboard
feeRecordSchema.index({ student: 1, status: 1 });
feeRecordSchema.index({ organizationId: 1, dueDate: 1 });

export default mongoose.model('FeeRecord', feeRecordSchema);
