import mongoose from "mongoose";

const billingHandoffSchema = new mongoose.Schema(
    {
        token: { type: String, required: true, unique: true },
        email: { type: String, required: true }, // The email the OTP is sent to
        otp: { type: String, required: true },   // The OTP value for verification
        organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
        
        // Razorpay details generated prior to handoff
        razorpay_order_id: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        razorpay_key_id: { type: String, required: true }, // So frontend knows which key to use
        
        // Context
        payment_type: { type: String, required: true, enum: ["saas_invoice", "fee_payment", "admission_fee", "canteen_order"] },
        return_url: { type: String, required: true }, // Where to redirect after success
        
        // Additional context (e.g., studentId, invoiceId, etc.) stored as a flexible object if needed
        context: { type: mongoose.Schema.Types.Mixed },
        
        // Status tracking
        // Status tracking
        verified: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
        lockoutUntil: { type: Date },
        
        // TTL Index: automatically delete document after 10 minutes
        createdAt: { type: Date, default: Date.now, expires: 600 } 
    },
    { timestamps: true }
);

export default mongoose.model("BillingHandoff", billingHandoffSchema);
