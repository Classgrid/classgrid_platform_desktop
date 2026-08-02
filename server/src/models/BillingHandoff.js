import mongoose from "mongoose";

const billingHandoffSchema = new mongoose.Schema(
    {
        // Stores a SHA-256 hash. The raw bearer token is returned once.
        token: { type: String, required: true, unique: true, select: false },
        email: { type: String, required: true }, // The email the OTP is sent to
        otp: { type: String, required: true, select: false }, // bcrypt hash
        organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
        paymentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentOrder", required: true },
        paymentAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentAttempt", required: true },
        referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
        referenceModel: {
            type: String,
            required: true,
            enum: ["Invoice", "SaasInvoice", "FeeRecord", "CanteenOrder"],
        },
        
        // Razorpay details generated prior to handoff
        razorpay_order_id: { type: String, required: true },
        amountPaise: {
            type: Number,
            required: true,
            min: 1,
            validate: { validator: Number.isSafeInteger, message: "{VALUE} is not an integer paise value" },
        },
        currency: { type: String, default: "INR" },
        razorpay_key_id: { type: String, required: true }, // So frontend knows which key to use
        
        // Context
        payment_type: { type: String, required: true, enum: ["saas_invoice", "fee_payment", "admission_fee", "canteen_order"] },
        return_url: { type: String, required: true }, // Where to redirect after success
        
        // Additional context (e.g., studentId, invoiceId, etc.) stored as a flexible object if needed
        context: { type: mongoose.Schema.Types.Mixed },
        
        verified: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
        lockoutUntil: { type: Date },
        otpVerifiedAt: { type: Date, default: null },
        consumedAt: { type: Date, default: null },
        resendCount: { type: Number, default: 0 },
        lastOtpSentAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

billingHandoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BillingHandoff || mongoose.model("BillingHandoff", billingHandoffSchema);
