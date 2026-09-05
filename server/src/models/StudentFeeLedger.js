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

const installmentSchema = new mongoose.Schema({
    title: String,
    dueDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'partially_paid', 'paid'],
        default: 'pending'
    }
});

const studentFeeLedgerSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    structureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeStructure'
    },
    installments: [installmentSchema],
    totalPayable: {
        type: Number,
        default: 0
    },
    totalPaid: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    lastPaymentDate: Date,
    nextDueDate: Date
}, { timestamps: true });

// Middleware to calculate balance before saving
studentFeeLedgerSchema.pre('save', function(next) {
    this.totalPaid = this.installments.reduce((acc, inst) => acc + inst.paidAmount, 0);
    this.balance = this.totalPayable - this.totalPaid;
    
    // Find next pending installment
    const nextInst = this.installments
        .filter(inst => inst.status !== 'paid')
        .sort((a, b) => a.dueDate - b.dueDate)[0];
    
    this.nextDueDate = nextInst ? nextInst.dueDate : null;
    next();
});

export default mongoose.model('StudentFeeLedger', studentFeeLedgerSchema);
