import mongoose from "mongoose";
import { PAYMENT_ATTEMPT_STAGE } from "../utils/billing.utils.js";

const paymentFailureSchema = new mongoose.Schema(
    {
        paymentAttemptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentAttempt",
            required: true,
        },
        paymentOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentOrder",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        failureStage: {
            type: String,
            enum: Object.values(PAYMENT_ATTEMPT_STAGE),
            required: true,
        },
        errorCode: { // Gateway error code, e.g. BAD_REQUEST_ERROR
            type: String,
            default: null,
        },
        errorDescription: { // Human readable failure reason
            type: String,
            default: null,
        },
        errorSource: { // e.g. "customer", "issuer", "gateway"
            type: String,
            default: null,
        },
        errorStep: { // e.g. "payment_authentication"
            type: String,
            default: null,
        },
        errorReason: { // e.g. "invalid_otp"
            type: String,
            default: null,
        },
        responsibility: {
            type: String,
            enum: ["USER_ACTION_REQUIRED", "CLASSGRID_ERROR", "INSTITUTION_CONFIGURATION_ERROR", "RAZORPAY_ERROR", "BANK_DECLINE", "NETWORK_ERROR", "EXPIRED_SESSION", "UNKNOWN"],
            default: "UNKNOWN",
        },
        retryEligibility: {
            type: Boolean, // Can we generate a fresh link?
            default: true,
        },
        userNotified: {
            type: Boolean,
            default: false,
        },
        resolved: {
            type: Boolean,
            default: false,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Support or Engineering owner
            default: null,
        },
        internalNotes: [{
            authorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            text: {
                type: String,
                required: true,
                trim: true,
                maxlength: 2000,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
        recoveryAttempts: [{
            action: {
                type: String,
                required: true,
                trim: true,
                maxlength: 100,
            },
            status: {
                type: String,
                enum: ["QUEUED", "SUCCESS", "FAILED", "REQUIRES_RECONCILIATION"],
                required: true,
            },
            note: {
                type: String,
                trim: true,
                maxlength: 1000,
                default: "",
            },
            actorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        }],
        organizationNotifiedAt: {
            type: Date,
            default: null,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
        resolution: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

paymentFailureSchema.index({ failureStage: 1, createdAt: 1 });
paymentFailureSchema.index({ resolved: 1 });

export default mongoose.models.PaymentFailure || mongoose.model("PaymentFailure", paymentFailureSchema);
