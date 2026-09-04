import mongoose from "mongoose";

const onboardingOTPSchema = new mongoose.Schema(
    {
        target: {
            type: String, // email address or phone number
            required: true,
            index: true,
            lowercase: true,
        },
        type: {
            type: String,
            enum: ["email", "phone"],
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        expires_at: {
            type: Date,
            required: true,
            index: { expires: 0 }, // Auto-delete after expiration (e.g. 10 mins)
        }
    },
    { timestamps: true }
);

export default mongoose.models.OnboardingOTP || mongoose.model("OnboardingOTP", onboardingOTPSchema);
